import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoUsuario, StatusAvaliacao } from '@prisma/client';
import {
  criarAvaliacaoSchema,
  filtrosAvaliacaoSchema,
  validarQueryParams,
  validarBody
} from '@/lib/validations/avaliacoes';
import { middlewareAtualizacaoStatus } from '@/lib/utils/periodo-status-updater';

// GET /api/avaliacoes - Listar avaliações com filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões - apenas ADMIN e GESTOR podem listar todas as avaliações
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { userType: true, atendente: { select: { id: true } } }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de listar avaliações
    await middlewareAtualizacaoStatus();

    const { searchParams } = new URL(request.url);
    const resultadoValidacao = validarQueryParams(filtrosAvaliacaoSchema, searchParams);
    
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

    // Construir filtros de consulta
    const where: any = {};

    // Se for ATENDENTE, só pode ver suas próprias avaliações (como avaliado ou avaliador)
    if (usuario.userType === TipoUsuario.ATENDENTE && usuario.atendente) {
      where.OR = [
        { avaliadorId: session.user.id },
        { avaliadoId: usuario.atendente.id }
      ];
    }

    // Aplicar filtros específicos
    if (filtros.periodoId) {
      where.periodoId = filtros.periodoId;
    }
    if (filtros.avaliadorId) {
      where.avaliadorId = filtros.avaliadorId;
    }
    if (filtros.avaliadoId) {
      where.avaliadoId = filtros.avaliadoId;
    }
    if (filtros.status) {
      where.status = filtros.status;
    }

    // Calcular offset para paginação
    const offset = (filtros.page - 1) * filtros.limit;

    // Buscar avaliações
    const [avaliacoes, total] = await Promise.all([
      prisma.avaliacao.findMany({
        where,
        include: {
          avaliador: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          avaliado: {
            select: {
              id: true,
              usuario: {
                select: {
                  nome: true,
                  email: true
                }
              },
              cargo: true,
              setor: true
            }
          },
          periodo: {
            select: {
              id: true,
              nome: true,
              dataInicio: true,
              dataFim: true,
              status: true
            }
          }
        },
        orderBy: {
          [filtros.orderBy]: filtros.orderDirection
        },
        skip: offset,
        take: filtros.limit
      }),
      prisma.avaliacao.count({ where })
    ]);

    // Calcular informações de paginação
    const totalPages = Math.ceil(total / filtros.limit);
    const hasNextPage = filtros.page < totalPages;
    const hasPreviousPage = filtros.page > 1;

    return NextResponse.json({
      avaliacoes,
      paginacao: {
        page: filtros.page,
        limit: filtros.limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });

  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/avaliacoes - Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const resultadoValidacao = validarBody(criarAvaliacaoSchema, body);
    
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

    // Verificar se o usuário existe e tem permissão
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { userType: true, atendente: { select: { id: true } } }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de verificar período ativo
    await middlewareAtualizacaoStatus();

    // Verificar se o período de avaliação existe e está ativo
    const periodo = await prisma.periodoAvaliacao.findUnique({
      where: { id: dadosValidados.periodoId },
      select: { id: true, status: true, dataInicio: true, dataFim: true }
    });

    if (!periodo) {
      return NextResponse.json(
        { error: 'Período de avaliação não encontrado' },
        { status: 404 }
      );
    }

    if (periodo.status !== 'ATIVO') {
      return NextResponse.json(
        { error: 'Período de avaliação não está ativo' },
        { status: 400 }
      );
    }

    // Verificar se está dentro do período
    const agora = new Date();
    if (agora < periodo.dataInicio || agora > periodo.dataFim) {
      return NextResponse.json(
        { error: 'Fora do período de avaliação' },
        { status: 400 }
      );
    }

    // Verificar se o atendente a ser avaliado existe
    const atendenteAvaliado = await prisma.atendente.findUnique({
      where: { id: dadosValidados.avaliadoId },
      select: { id: true, status: true }
    });

    if (!atendenteAvaliado) {
      return NextResponse.json(
        { error: 'Atendente a ser avaliado não encontrado' },
        { status: 404 }
      );
    }

    if (atendenteAvaliado.status !== 'ATIVO') {
      return NextResponse.json(
        { error: 'Atendente a ser avaliado não está ativo' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma avaliação do mesmo avaliador para o mesmo avaliado no mesmo período
    const avaliacaoExistente = await prisma.avaliacao.findUnique({
      where: {
        avaliadorId_avaliadoId_periodoId: {
          avaliadorId: session.user.id,
          avaliadoId: dadosValidados.avaliadoId,
          periodoId: dadosValidados.periodoId
        }
      }
    });

    if (avaliacaoExistente) {
      return NextResponse.json(
        { error: 'Você já avaliou este atendente neste período' },
        { status: 409 }
      );
    }

    // Criar a avaliação
    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        avaliadorId: session.user.id,
        avaliadoId: dadosValidados.avaliadoId,
        periodoId: dadosValidados.periodoId,
        nota: dadosValidados.nota,
        comentario: dadosValidados.comentario,
        status: StatusAvaliacao.CONCLUIDA
      },
      include: {
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        avaliado: {
          select: {
            id: true,
            usuario: {
              select: {
                nome: true,
                email: true
              }
            },
            cargo: true,
            setor: true
          }
        },
        periodo: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    return NextResponse.json(novaAvaliacao, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}