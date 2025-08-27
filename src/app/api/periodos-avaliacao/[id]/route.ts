import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoUsuario, StatusPeriodo } from '@prisma/client';
import {
  atualizarPeriodoSchema,
  idParamSchema,
  validarBody,
  validarDados
} from '@/lib/validations/avaliacoes';
import { middlewareAtualizacaoStatus } from '@/lib/utils/periodo-status-updater';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/periodos-avaliacao/[id] - Buscar período específico
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar parâmetro ID
    const resultadoValidacao = validarDados(idParamSchema, params);
    if (!resultadoValidacao.sucesso) {
      return NextResponse.json(
        { 
          error: 'ID inválido', 
          details: resultadoValidacao.erro?.details 
        },
        { status: 400 }
      );
    }

    const { id } = resultadoValidacao.dados;

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

    // Apenas ADMIN e GESTOR podem visualizar períodos
    if (usuario.userType !== TipoUsuario.ADMIN && usuario.userType !== TipoUsuario.GESTOR) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar períodos de avaliação' },
        { status: 403 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de buscar
    await middlewareAtualizacaoStatus();

    // Buscar o período
    const periodo = await prisma.periodoAvaliacao.findUnique({
      where: { id },
      include: {
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        avaliacoes: {
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
            }
          }
        },
        _count: {
          select: {
            avaliacoes: true
          }
        }
      }
    });

    if (!periodo) {
      return NextResponse.json(
        { error: 'Período não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(periodo);

  } catch (error) {
    console.error('Erro ao buscar período:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/periodos-avaliacao/[id] - Atualizar período
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar parâmetro ID
    const resultadoValidacaoId = validarDados(idParamSchema, params);
    if (!resultadoValidacaoId.sucesso) {
      return NextResponse.json(
        { 
          error: 'ID inválido', 
          details: resultadoValidacaoId.erro?.details 
        },
        { status: 400 }
      );
    }

    const { id } = resultadoValidacaoId.dados;
    const body = await request.json();
    
    // Validar dados de atualização
    const resultadoValidacao = validarBody(atualizarPeriodoSchema, body);
    if (!resultadoValidacao.sucesso) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: resultadoValidacao.erro?.details 
        },
        { status: 400 }
      );
    }
    
    const dadosValidados = resultadoValidacao.dados;

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

    // Apenas ADMIN e GESTOR podem atualizar períodos
    if (usuario.userType !== TipoUsuario.ADMIN && usuario.userType !== TipoUsuario.GESTOR) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar períodos de avaliação' },
        { status: 403 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de atualizar
    await middlewareAtualizacaoStatus();

    // Verificar se o período existe
    const periodoExistente = await prisma.periodoAvaliacao.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            avaliacoes: true
          }
        }
      }
    });

    if (!periodoExistente) {
      return NextResponse.json(
        { error: 'Período não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o nome já existe (se estiver sendo alterado)
    if (dadosValidados.nome && dadosValidados.nome !== periodoExistente.nome) {
      const nomeExistente = await prisma.periodoAvaliacao.findFirst({
        where: {
          nome: dadosValidados.nome,
          id: { not: id }
        }
      });

      if (nomeExistente) {
        return NextResponse.json(
          { error: 'Já existe um período com este nome' },
          { status: 409 }
        );
      }
    }

    // Verificar regras de negócio para mudança de status
    if (dadosValidados.status && dadosValidados.status !== periodoExistente.status) {
      // Não permitir ativar período se há avaliações pendentes em outros períodos ativos
      if (dadosValidados.status === StatusPeriodo.ATIVO) {
        const periodosAtivos = await prisma.periodoAvaliacao.findMany({
          where: {
            status: StatusPeriodo.ATIVO,
            id: { not: id }
          }
        });

        if (periodosAtivos.length > 0) {
          return NextResponse.json(
            { 
              error: 'Não é possível ativar este período pois já existe outro período ativo',
              periodosAtivos: periodosAtivos.map(p => ({ id: p.id, nome: p.nome }))
            },
            { status: 409 }
          );
        }
      }

      // Não permitir cancelar período se há avaliações concluídas
      if (dadosValidados.status === StatusPeriodo.CANCELADO) {
        const avaliacoesConcluidas = await prisma.avaliacao.count({
          where: {
            periodoId: id,
            status: 'CONCLUIDA'
          }
        });

        if (avaliacoesConcluidas > 0) {
          return NextResponse.json(
            { error: 'Não é possível cancelar período com avaliações concluídas' },
            { status: 409 }
          );
        }
      }
    }

    // Verificar conflito de datas (se estiver alterando datas)
    if (dadosValidados.dataInicio || dadosValidados.dataFim) {
      const novaDataInicio = dadosValidados.dataInicio ? new Date(dadosValidados.dataInicio) : periodoExistente.dataInicio;
      const novaDataFim = dadosValidados.dataFim ? new Date(dadosValidados.dataFim) : periodoExistente.dataFim;

      const periodosConflitantes = await prisma.periodoAvaliacao.findMany({
        where: {
          id: { not: id },
          status: {
            in: [StatusPeriodo.ATIVO, StatusPeriodo.PLANEJADO]
          },
          OR: [
            {
              AND: [
                { dataInicio: { lte: novaDataInicio } },
                { dataFim: { gte: novaDataInicio } }
              ]
            },
            {
              AND: [
                { dataInicio: { lte: novaDataFim } },
                { dataFim: { gte: novaDataFim } }
              ]
            },
            {
              AND: [
                { dataInicio: { gte: novaDataInicio } },
                { dataFim: { lte: novaDataFim } }
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
    }

    // Atualizar o período
    const periodoAtualizado = await prisma.periodoAvaliacao.update({
      where: { id },
      data: {
        ...dadosValidados,
        dataInicio: dadosValidados.dataInicio ? new Date(dadosValidados.dataInicio) : undefined,
        dataFim: dadosValidados.dataFim ? new Date(dadosValidados.dataFim) : undefined,
        atualizadoEm: new Date()
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
    });

    return NextResponse.json(periodoAtualizado);

  } catch (error) {
    console.error('Erro ao atualizar período:', error);
    


    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/periodos-avaliacao/[id] - Deletar período
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar parâmetro ID
    const resultadoValidacao = validarDados(idParamSchema, params);
    if (!resultadoValidacao.sucesso) {
      return NextResponse.json(
        { 
          error: 'ID inválido', 
          details: resultadoValidacao.erro?.details 
        },
        { status: 400 }
      );
    }

    const { id } = resultadoValidacao.dados;

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

    // Apenas ADMIN pode deletar períodos
    if (usuario.userType !== TipoUsuario.ADMIN) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar períodos de avaliação' },
        { status: 403 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de deletar
    await middlewareAtualizacaoStatus();

    // Verificar se o período existe
    const periodoExistente = await prisma.periodoAvaliacao.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            avaliacoes: true
          }
        }
      }
    });

    if (!periodoExistente) {
      return NextResponse.json(
        { error: 'Período não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir deletar período com avaliações
    if (periodoExistente._count.avaliacoes > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar período que possui avaliações' },
        { status: 409 }
      );
    }

    // Deletar o período
    await prisma.periodoAvaliacao.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Período deletado com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao deletar período:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}