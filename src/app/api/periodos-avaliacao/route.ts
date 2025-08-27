import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoUsuario, StatusPeriodo } from '@prisma/client';
import {
  criarPeriodoSchema,
  filtrosPeriodoSchema,
  validarQueryParams,
  validarBody
} from '@/lib/validations/avaliacoes';
import { middlewareAtualizacaoStatus } from '@/lib/utils/periodo-status-updater';

// GET /api/periodos-avaliacao - Listar períodos de avaliação
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { userType: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Apenas ADMIN e GESTOR podem listar períodos
    if (usuario.userType !== TipoUsuario.ADMIN && usuario.userType !== TipoUsuario.GESTOR) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar períodos de avaliação' },
        { status: 403 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de listar
    await middlewareAtualizacaoStatus();

    const { searchParams } = new URL(request.url);
    const resultadoValidacao = validarQueryParams(filtrosPeriodoSchema, searchParams);
    
    if (!resultadoValidacao.sucesso) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros inválidos', 
          detalhes: resultadoValidacao.erro?.details 
        },
        { status: 400 }
      );
    }
    
    const filtros = resultadoValidacao.dados;

    // Construir filtros para a consulta
    const where: any = {};

    if (filtros.status) {
      where.status = filtros.status;
    }

    if (filtros.dataInicio) {
      where.dataInicio = {
        gte: new Date(filtros.dataInicio)
      };
    }

    if (filtros.dataFim) {
      where.dataFim = {
        lte: new Date(filtros.dataFim)
      };
    }

    if (filtros.criadoPor) {
      where.criadoPorId = filtros.criadoPor;
    }

    // Calcular paginação
    const skip = (filtros.page - 1) * filtros.limit;

    // Buscar períodos com paginação
    const [periodos, total] = await Promise.all([
      prisma.periodoAvaliacao.findMany({
        where,
        skip,
        take: filtros.limit,
        orderBy: {
          [filtros.orderBy]: filtros.orderDirection
        },
        include: {
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          _count: {
            select: {
              avaliacoes: true
            }
          }
        }
      }),
      prisma.periodoAvaliacao.count({ where })
    ]);

    const totalPages = Math.ceil(total / filtros.limit);

    return NextResponse.json({
      periodos,
      pagination: {
        page: filtros.page,
        limit: filtros.limit,
        total,
        totalPages,
        hasNext: filtros.page < totalPages,
        hasPrev: filtros.page > 1
      }
    });

  } catch (error) {
    console.error('Erro ao listar períodos de avaliação:', error);
    
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/periodos-avaliacao - Criar novo período de avaliação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { userType: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Apenas ADMIN e GESTOR podem criar períodos
    if (usuario.userType !== TipoUsuario.ADMIN && usuario.userType !== TipoUsuario.GESTOR) {
      return NextResponse.json(
        { error: 'Sem permissão para criar períodos de avaliação' },
        { status: 403 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de criar novo
    await middlewareAtualizacaoStatus();

    const body = await request.json();
    const resultadoValidacao = validarBody(criarPeriodoSchema, body);
    
    if (!resultadoValidacao.sucesso) {
      return NextResponse.json(
        { 
          erro: 'Dados inválidos', 
          detalhes: resultadoValidacao.erro?.details 
        },
        { status: 400 }
      );
    }
    
    const dadosValidados = resultadoValidacao.dados;

    // Verificar se já existe um período com o mesmo nome
    const periodoExistente = await prisma.periodoAvaliacao.findFirst({
      where: {
        nome: dadosValidados.nome
      }
    });

    if (periodoExistente) {
      return NextResponse.json(
        { error: 'Já existe um período com este nome' },
        { status: 409 }
      );
    }

    // Verificar se há conflito de datas com períodos ativos
    const dataInicio = new Date(dadosValidados.dataInicio);
    const dataFim = new Date(dadosValidados.dataFim);

    const periodosConflitantes = await prisma.periodoAvaliacao.findMany({
      where: {
        status: {
          in: [StatusPeriodo.ATIVO, StatusPeriodo.PLANEJADO]
        },
        OR: [
          {
            AND: [
              { dataInicio: { lte: dataInicio } },
              { dataFim: { gte: dataInicio } }
            ]
          },
          {
            AND: [
              { dataInicio: { lte: dataFim } },
              { dataFim: { gte: dataFim } }
            ]
          },
          {
            AND: [
              { dataInicio: { gte: dataInicio } },
              { dataFim: { lte: dataFim } }
            ]
          }
        ]
      }
    });

    if (periodosConflitantes.length > 0) {
      return NextResponse.json(
        { 
          error: 'Há conflito de datas com outros períodos ativos ou planejados',
          conflitos: periodosConflitantes.map(p => ({
            id: p.id,
            nome: p.nome,
            dataInicio: p.dataInicio,
            dataFim: p.dataFim
          }))
        },
        { status: 409 }
      );
    }

    // Criar o período
    const novoPeriodo = await prisma.periodoAvaliacao.create({
      data: {
        nome: dadosValidados.nome,
        descricao: dadosValidados.descricao,
        dataInicio,
        dataFim,
        status: dadosValidados.status,
        criadoPorId: session.user.id
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(novoPeriodo, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar período de avaliação:', error);
    
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}