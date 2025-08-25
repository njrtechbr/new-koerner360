import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  idAtendenteSchema,
  MENSAGENS_ERRO_ATENDENTES,
} from '@/lib/validations/atendentes';
import { consultaHistoricoSchema } from '@/lib/validations/historico-atendentes';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/atendentes/[id]/historico
 * Lista o histórico de alterações de um atendente
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN e GERENTE podem ver histórico)
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar ID
    const atendenteId = idAtendenteSchema.parse(params.id);

    // Verificar se o atendente existe
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      select: {
        id: true,
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
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Extrair parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const parametrosConsulta = Object.fromEntries(searchParams.entries());

    // Validar parâmetros
    const {
      pagina = 1,
      limite = 20,
      tipo,
      dataInicio,
      dataFim,
      criadoPorId,
    } = consultaHistoricoSchema.parse(parametrosConsulta);

    // Construir filtros
    const filtros: any = {
      atendenteId,
    };

    if (tipo) {
      filtros.tipo = tipo;
    }

    if (dataInicio || dataFim) {
      filtros.criadoEm = {};
      if (dataInicio) {
        filtros.criadoEm.gte = new Date(dataInicio);
      }
      if (dataFim) {
        filtros.criadoEm.lte = new Date(dataFim);
      }
    }

    if (criadoPorId) {
      filtros.criadoPorId = criadoPorId;
    }

    // Calcular offset
    const offset = (pagina - 1) * limite;

    // Buscar histórico com paginação
    const [historico, total] = await Promise.all([
      prisma.historicoAlteracaoAtendente.findMany({
        where: filtros,
        include: {
          usuario: {
            select: {
              nome: true,
              email: true,
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

    // Buscar estatísticas do histórico
    const estatisticas = await prisma.historicoAlteracaoAtendente.groupBy({
      by: ['tipo'],
      where: { atendenteId },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      atendente: {
        id: atendente.id,
        nome: atendente.usuario.nome,
        email: atendente.usuario.email,
      },
      historico: historico.map(item => ({
        id: item.id,
        tipoAlteracao: item.tipo,
        descricao: item.descricao,
        dadosAnteriores: item.dadosAnteriores
          ? JSON.parse(item.dadosAnteriores)
          : null,
        dadosNovos: item.dadosNovos ? JSON.parse(item.dadosNovos) : null,
        alteradoPor: {
          id: item.criadoPorId,
          nome: item.usuario.nome,
          email: item.usuario.email,
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
        porTipo: estatisticas.reduce(
          (acc, item) => {
            acc[item.tipo] = item._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      filtros: {
        tipo,
        dataInicio,
        dataFim,
        criadoPorId,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar histórico do atendente:', error);

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
