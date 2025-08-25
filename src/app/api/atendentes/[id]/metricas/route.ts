import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { idAtendenteSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { z } from 'zod';

/**
 * Schema para filtros de métricas
 */
const filtrosMetricasSchema = z.object({
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  periodo: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d'),
});

/**
 * Interface para parâmetros da rota
 */
interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/atendentes/[id]/metricas
 * Busca métricas de desempenho de um atendente específico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões
    if (!['ADMIN', 'GERENTE', 'ATENDENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: 'Sem permissão para acessar métricas' },
        { status: 403 }
      );
    }

    // Validar ID do atendente
    const atendenteId = idAtendenteSchema.parse(params.id);

    // Verificar se o atendente existe
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      select: {
        id: true,
        usuarioId: true,
        status: true,
        dataAdmissao: true,
        cargo: true,
        setor: true,
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!atendente) {
      return NextResponse.json(
        { erro: 'Atendente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o atendente pode ver apenas suas próprias métricas
    if (
      session.user.userType === 'ATENDENTE' &&
      atendente.usuarioId !== session.user.id
    ) {
      return NextResponse.json(
        { erro: 'Sem permissão para acessar estas métricas' },
        { status: 403 }
      );
    }

    // Processar filtros da query string
    const { searchParams } = new URL(request.url);
    const filtros = filtrosMetricasSchema.parse({
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      periodo: searchParams.get('periodo') || '30d',
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

    // Buscar métricas básicas
    const [documentosCount, avaliacoes, historico] = await Promise.all([
      // Contagem de documentos
      prisma.documentoAtendente.count({
        where: {
          atendenteId,
          ativo: true,
          criadoEm: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
      }),

      // Avaliações no período
      prisma.avaliacao.findMany({
        where: {
          atendenteId,
          dataAvaliacao: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        select: {
          nota: true,
          dataAvaliacao: true,
          comentario: true,
        },
        orderBy: {
          dataAvaliacao: 'desc',
        },
      }),

      // Histórico de alterações
      prisma.historicoAlteracaoAtendente.findMany({
        where: {
          atendenteId,
          criadoEm: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        select: {
          tipo: true,
          criadoEm: true,
        },
      }),
    ]);

    // Calcular métricas de avaliação
    const mediaAvaliacoes =
      avaliacoes.length > 0
        ? avaliacoes.reduce((acc, av) => acc + av.nota, 0) / avaliacoes.length
        : 0;

    const ultimaAvaliacao = avaliacoes[0];

    // Calcular atividade por tipo
    const atividadePorTipo = historico.reduce(
      (acc, item) => {
        acc[item.tipo] = (acc[item.tipo] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calcular dias desde a admissão
    const diasDesdeAdmissao = Math.floor(
      (new Date().getTime() - new Date(atendente.dataAdmissao).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Montar resposta com métricas
    const metricas = {
      atendente: {
        id: atendente.id,
        nome: atendente.usuario.nome,
        email: atendente.usuario.email,
        cargo: atendente.cargo,
        setor: atendente.setor,
        status: atendente.status,
        dataAdmissao: atendente.dataAdmissao,
        diasDesdeAdmissao,
      },
      periodo: {
        dataInicio,
        dataFim,
        periodo: filtros.periodo,
      },
      documentos: {
        total: documentosCount,
        ativosNoPeriodo: documentosCount,
      },
      avaliacoes: {
        total: avaliacoes.length,
        media: Number(mediaAvaliacoes.toFixed(2)),
        ultima: ultimaAvaliacao
          ? {
              nota: ultimaAvaliacao.nota,
              data: ultimaAvaliacao.dataAvaliacao,
              comentario: ultimaAvaliacao.comentario,
            }
          : null,
      },
      atividade: {
        totalAlteracoes: historico.length,
        porTipo: atividadePorTipo,
      },
      resumo: {
        produtividade:
          mediaAvaliacoes >= 8
            ? 'Alta'
            : mediaAvaliacoes >= 6
              ? 'Média'
              : 'Baixa',
        statusGeral: atendente.status,
        documentosAtualizados: documentosCount > 0,
        avaliacoesRecentes: avaliacoes.length > 0,
      },
    };

    return NextResponse.json({
      metricas,
      geradoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do atendente:', error);

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
