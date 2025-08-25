import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ZodError } from 'zod';
import { z } from 'zod';

/**
 * Schema para filtros do dashboard
 */
const filtrosDashboardSchema = z.object({
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  periodo: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d'),
  setor: z.string().optional(),
  cargo: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'SUSPENSO']).optional(),
});

/**
 * GET /api/atendentes/dashboard
 * Busca métricas gerais do dashboard de atendentes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões - apenas ADMIN e GERENTE podem ver dashboard geral
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: 'Sem permissão para acessar dashboard geral' },
        { status: 403 }
      );
    }

    // Processar filtros da query string
    const { searchParams } = new URL(request.url);
    const filtros = filtrosDashboardSchema.parse({
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      periodo: searchParams.get('periodo') || '30d',
      setor: searchParams.get('setor'),
      cargo: searchParams.get('cargo'),
      status: searchParams.get('status'),
    });

    // Calcular datas baseadas no período
    let dataInicio: Date;
    let dataFim: Date = new Date();

    if (filtros.periodo === 'custom' && filtros.dataInicio && filtros.dataFim) {
      dataInicio = new Date(filtros.dataInicio);
      dataFim = new Date(filtros.dataFim);
    } else {
      const agora = new Date();
      switch (filtros.periodo) {
        case '7d':
          dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dataInicio = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dataInicio = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Construir filtros para consultas
    const filtroAtendentes: any = {};
    if (filtros.setor) filtroAtendentes.setor = filtros.setor;
    if (filtros.cargo) filtroAtendentes.cargo = filtros.cargo;
    if (filtros.status) filtroAtendentes.status = filtros.status;

    // Buscar dados gerais
    const [
      totalAtendentes,
      atendentesPorStatus,
      atendentesPorSetor,
      atendentesPorCargo,
    ] = await Promise.all([
      // Total de atendentes
      prisma.atendente.count({
        where: filtroAtendentes,
      }),

      // Atendentes por status
      prisma.atendente.groupBy({
        by: ['status'],
        where: filtroAtendentes,
        _count: {
          id: true,
        },
      }),

      // Atendentes por setor
      prisma.atendente.groupBy({
        by: ['setor'],
        where: filtroAtendentes,
        _count: {
          id: true,
        },
      }),

      // Atendentes por cargo
      prisma.atendente.groupBy({
        by: ['cargo'],
        where: filtroAtendentes,
        _count: {
          id: true,
        },
      }),
    ]);

    // Buscar métricas de atividade no período
    const [documentosNoPeriodo, avaliacoesNoPeriodo, alteracoesNoPeriodo] =
      await Promise.all([
        // Documentos criados no período
        prisma.documentoAtendente.count({
          where: {
            ativo: true,
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
            atendente: filtroAtendentes,
          },
        }),

        // Avaliações no período
        prisma.avaliacao.findMany({
          where: {
            dataAvaliacao: {
              gte: dataInicio,
              lte: dataFim,
            },
            atendente: filtroAtendentes,
          },
          select: {
            nota: true,
            atendenteId: true,
            dataAvaliacao: true,
          },
        }),

        // Alterações no período
        prisma.historicoAlteracaoAtendente.groupBy({
          by: ['tipo'],
          where: {
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
            atendente: filtroAtendentes,
          },
          _count: {
            id: true,
          },
        }),
      ]);

    // Calcular métricas de avaliação
    const mediaGeralAvaliacoes =
      avaliacoesNoPeriodo.length > 0
        ? avaliacoesNoPeriodo.reduce((acc, av) => acc + av.nota, 0) /
          avaliacoesNoPeriodo.length
        : 0;

    // Agrupar avaliações por atendente
    const avaliacoesPorAtendente = avaliacoesNoPeriodo.reduce(
      (acc, av) => {
        if (!acc[av.atendenteId]) {
          acc[av.atendenteId] = [];
        }
        acc[av.atendenteId].push(av.nota);
        return acc;
      },
      {} as Record<string, number[]>
    );

    // Calcular distribuição de performance
    const distribuicaoPerformance = {
      alta: 0, // >= 8
      media: 0, // 6-7.9
      baixa: 0, // < 6
    };

    Object.values(avaliacoesPorAtendente).forEach(notas => {
      const media = notas.reduce((acc, nota) => acc + nota, 0) / notas.length;
      if (media >= 8) distribuicaoPerformance.alta++;
      else if (media >= 6) distribuicaoPerformance.media++;
      else distribuicaoPerformance.baixa++;
    });

    // Buscar top performers
    const topPerformers = await prisma.atendente.findMany({
      where: {
        ...filtroAtendentes,
        avaliacoes: {
          some: {
            dataAvaliacao: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        },
      },
      select: {
        id: true,
        cargo: true,
        setor: true,
        usuario: {
          select: {
            nome: true,
          },
        },
        avaliacoes: {
          where: {
            dataAvaliacao: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
          select: {
            nota: true,
          },
        },
      },
      take: 10,
    });

    // Calcular média para cada top performer e ordenar
    const topPerformersComMedia = topPerformers
      .map(atendente => ({
        id: atendente.id,
        nome: atendente.usuario.nome,
        cargo: atendente.cargo,
        setor: atendente.setor,
        mediaAvaliacoes:
          atendente.avaliacoes.length > 0
            ? atendente.avaliacoes.reduce((acc, av) => acc + av.nota, 0) /
              atendente.avaliacoes.length
            : 0,
        totalAvaliacoes: atendente.avaliacoes.length,
      }))
      .filter(atendente => atendente.totalAvaliacoes > 0)
      .sort((a, b) => b.mediaAvaliacoes - a.mediaAvaliacoes)
      .slice(0, 5);

    // Calcular tendências (comparar com período anterior)
    const periodoAnteriorInicio = new Date(
      dataInicio.getTime() - (dataFim.getTime() - dataInicio.getTime())
    );
    const periodoAnteriorFim = dataInicio;

    const [documentosPeriodoAnterior, avaliacoesPeriodoAnterior] =
      await Promise.all([
        prisma.documentoAtendente.count({
          where: {
            ativo: true,
            criadoEm: {
              gte: periodoAnteriorInicio,
              lte: periodoAnteriorFim,
            },
            atendente: filtroAtendentes,
          },
        }),

        prisma.avaliacao.findMany({
          where: {
            dataAvaliacao: {
              gte: periodoAnteriorInicio,
              lte: periodoAnteriorFim,
            },
            atendente: filtroAtendentes,
          },
          select: {
            nota: true,
          },
        }),
      ]);

    const mediaAvaliacoesPeriodoAnterior =
      avaliacoesPeriodoAnterior.length > 0
        ? avaliacoesPeriodoAnterior.reduce((acc, av) => acc + av.nota, 0) /
          avaliacoesPeriodoAnterior.length
        : 0;

    // Calcular tendências
    const tendencias = {
      documentos: {
        atual: documentosNoPeriodo,
        anterior: documentosPeriodoAnterior,
        variacao:
          documentosPeriodoAnterior > 0
            ? ((documentosNoPeriodo - documentosPeriodoAnterior) /
                documentosPeriodoAnterior) *
              100
            : documentosNoPeriodo > 0
              ? 100
              : 0,
      },
      avaliacoes: {
        atual: Number(mediaGeralAvaliacoes.toFixed(2)),
        anterior: Number(mediaAvaliacoesPeriodoAnterior.toFixed(2)),
        variacao:
          mediaAvaliacoesPeriodoAnterior > 0
            ? ((mediaGeralAvaliacoes - mediaAvaliacoesPeriodoAnterior) /
                mediaAvaliacoesPeriodoAnterior) *
              100
            : mediaGeralAvaliacoes > 0
              ? 100
              : 0,
      },
    };

    // Montar resposta do dashboard
    const dashboard = {
      periodo: {
        dataInicio,
        dataFim,
        periodo: filtros.periodo,
      },
      filtros: {
        setor: filtros.setor,
        cargo: filtros.cargo,
        status: filtros.status,
      },
      resumoGeral: {
        totalAtendentes,
        atendentesPorStatus: atendentesPorStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        atendentesPorSetor: atendentesPorSetor.reduce(
          (acc, item) => {
            acc[item.setor] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        atendentesPorCargo: atendentesPorCargo.reduce(
          (acc, item) => {
            acc[item.cargo] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      metricas: {
        documentos: {
          totalNoPeriodo: documentosNoPeriodo,
          mediaPorAtendente:
            totalAtendentes > 0
              ? Number((documentosNoPeriodo / totalAtendentes).toFixed(2))
              : 0,
        },
        avaliacoes: {
          totalNoPeriodo: avaliacoesNoPeriodo.length,
          mediaGeral: Number(mediaGeralAvaliacoes.toFixed(2)),
          distribuicaoPerformance,
        },
        atividade: {
          totalAlteracoes: alteracoesNoPeriodo.reduce(
            (acc, item) => acc + item._count.id,
            0
          ),
          alteracoesPorTipo: alteracoesNoPeriodo.reduce(
            (acc, item) => {
              acc[item.tipo] = item._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      },
      topPerformers,
      tendencias,
      insights: {
        atendentesMaisAtivos: totalAtendentes > 0,
        performanceGeral:
          mediaGeralAvaliacoes >= 8
            ? 'Excelente'
            : mediaGeralAvaliacoes >= 6
              ? 'Boa'
              : 'Precisa melhorar',
        crescimentoDocumentos: tendencias.documentos.variacao > 0,
        melhoriaAvaliacoes: tendencias.avaliacoes.variacao > 0,
      },
    };

    return NextResponse.json({
      dashboard,
      geradoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard de atendentes:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          erro: 'Dados inválidos',
          detalhes: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
