import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ZodError } from 'zod';
import { consultaHistoricoGeralSchema } from '@/lib/validations/historico-atendentes';
import { MENSAGENS_ERRO_ATENDENTES } from '@/lib/constants/mensagens';

/**
 * GET /api/atendentes/historico
 * Lista o histórico de alterações de todos os atendentes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN e GERENTE podem ver histórico geral)
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Extrair parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const parametrosConsulta = Object.fromEntries(searchParams.entries());

    // Validar parâmetros
    const {
      pagina = 1,
      limite = 20,
      busca,
      atendenteId,
      tipo,
      dataInicio,
      dataFim,
      criadoPorId,
    } = consultaHistoricoGeralSchema.parse(parametrosConsulta);

    // Construir filtros
    const filtros: any = {};

    // Filtro por atendente específico
    if (atendenteId) {
      filtros.atendenteId = atendenteId;
    }

    // Filtro por tipo de alteração
    if (tipo) {
      filtros.tipo = tipo;
    }

    // Filtro por período
    if (dataInicio || dataFim) {
      filtros.criadoEm = {};
      if (dataInicio) {
        filtros.criadoEm.gte = new Date(dataInicio);
      }
      if (dataFim) {
        filtros.criadoEm.lte = new Date(dataFim);
      }
    }

    // Filtro por usuário que fez a alteração
    if (criadoPorId) {
      filtros.criadoPorId = criadoPorId;
    }

    // Filtro de busca (nome do atendente ou descrição)
    if (busca) {
      filtros.OR = [
        {
          atendente: {
            usuario: {
              nome: {
                contains: busca,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          descricao: {
            contains: busca,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Calcular offset
    const offset = (pagina - 1) * limite;

    // Buscar histórico com paginação
    const [historico, total] = await Promise.all([
      prisma.historicoAlteracaoAtendente.findMany({
        where: filtros,
        include: {
          atendente: {
            select: {
              id: true,
              usuario: {
                select: {
                  nome: true,
                  email: true,
                },
              },
              cargo: true,
              setor: true,
              status: true,
            },
          },
          usuario: {
            select: {
              nome: true,
              email: true,
              userType: true,
            },
          },
        },
        orderBy: {
          criadoEm: 'desc',
        },
        skip: offset,
        take: limite,
      }),
      prisma.historicoAlteracaoAtendente.count({
        where: filtros,
      }),
    ]);

    // Calcular informações de paginação
    const totalPaginas = Math.ceil(total / limite);
    const temProximaPagina = pagina < totalPaginas;
    const temPaginaAnterior = pagina > 1;

    // Buscar estatísticas gerais
    const [estatisticasPorTipo, estatisticasPorPeriodo, topUsuarios] =
      await Promise.all([
        // Estatísticas por tipo de alteração
        prisma.historicoAlteracaoAtendente.groupBy({
          by: ['tipo'],
          where: filtros,
          _count: {
            id: true,
          },
        }),

        // Estatísticas por período (últimos 7 dias)
        prisma.historicoAlteracaoAtendente.groupBy({
          by: ['tipo'],
          where: {
            ...filtros,
            criadoEm: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          _count: {
            id: true,
          },
        }),

        // Top 5 usuários que mais fizeram alterações
        prisma.historicoAlteracaoAtendente.groupBy({
          by: ['criadoPorId'],
          where: filtros,
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 5,
        }),
      ]);

    // Buscar informações dos top usuários
    const idsTopUsuarios = topUsuarios
      .map(item => item.criadoPorId)
      .filter(Boolean);
    const informacoesTopUsuarios = await prisma.usuario.findMany({
      where: {
        id: {
          in: idsTopUsuarios,
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        userType: true,
      },
    });

    // Mapear top usuários com suas informações
    const topUsuariosCompletos = topUsuarios.map(item => {
      const usuario = informacoesTopUsuarios.find(
        u => u.id === item.criadoPorId
      );
      return {
        usuario: usuario || {
          id: item.criadoPorId || 'N/A',
          nome: 'Usuário não encontrado',
          email: '',
          userType: '',
        },
        totalAlteracoes: item._count.id,
      };
    });

    return NextResponse.json({
      historico: historico.map(item => ({
        id: item.id,
        tipoAlteracao: item.tipo,
        descricao: item.descricao,
        dadosAnteriores: item.dadosAnteriores
          ? JSON.parse(item.dadosAnteriores)
          : null,
        dadosNovos: item.dadosNovos ? JSON.parse(item.dadosNovos) : null,
        atendente: {
          id: item.atendente.id,
          nome: item.atendente.usuario.nome,
          email: item.atendente.usuario.email,
          cargo: item.atendente.cargo,
          setor: item.atendente.setor,
          status: item.atendente.status,
        },
        alteradoPor: {
          id: item.criadoPorId,
          nome: item.usuario.nome,
          email: item.usuario.email,
          tipo: item.usuario.userType,
        },
        criadoEm: item.criadoEm,
      })),
      paginacao: {
        paginaAtual: pagina,
        totalPaginas,
        totalItens: total,
        itensPorPagina: limite,
        temProximaPagina,
        temPaginaAnterior,
      },
      estatisticas: {
        totalAlteracoes: total,
        porTipo: estatisticasPorTipo.reduce(
          (acc, item) => {
            acc[item.tipo] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        ultimos7Dias: estatisticasPorPeriodo.reduce(
          (acc, item) => {
            acc[item.tipo] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        topUsuarios: topUsuariosCompletos,
      },
      filtros: {
        busca,
        atendenteId,
        tipo,
        dataInicio,
        dataFim,
        criadoPorId,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar histórico geral de atendentes:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          erro: MENSAGENS_ERRO_ATENDENTES.DADOS_INVALIDOS,
          detalhes: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: MENSAGENS_ERRO_ATENDENTES.ERRO_INTERNO },
      { status: 500 }
    );
  }
}
