import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoUsuario, StatusAvaliacao } from '@prisma/client';
import {
  atualizarAvaliacaoSchema,
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

// GET /api/avaliacoes/[id] - Buscar avaliação específica
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
      select: { userType: true, atendente: { select: { id: true } } }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de buscar avaliação
    await middlewareAtualizacaoStatus();

    // Buscar a avaliação
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id },
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
            setor: true,
            departamento: true
          }
        },
        periodo: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            dataInicio: true,
            dataFim: true,
            status: true
          }
        }
      }
    });

    if (!avaliacao) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para ver esta avaliação
    const podeVer = 
      usuario.userType === TipoUsuario.ADMIN ||
      usuario.userType === TipoUsuario.GESTOR ||
      avaliacao.avaliadorId === session.user.id ||
      (usuario.atendente && avaliacao.avaliadoId === usuario.atendente.id);

    if (!podeVer) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar esta avaliação' },
        { status: 403 }
      );
    }

    return NextResponse.json(avaliacao);

  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/avaliacoes/[id] - Atualizar avaliação
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
    const resultadoValidacao = validarBody(atualizarAvaliacaoSchema, body);
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

    // Atualizar automaticamente os status dos períodos antes de verificar avaliação
    await middlewareAtualizacaoStatus();

    // Verificar se a avaliação existe
    const avaliacaoExistente = await prisma.avaliacao.findUnique({
      where: { id },
      include: {
        periodo: {
          select: {
            status: true,
            dataInicio: true,
            dataFim: true
          }
        }
      }
    });

    if (!avaliacaoExistente) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
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

    // Verificar se o usuário tem permissão para editar esta avaliação
    const podeEditar = 
      usuario.userType === TipoUsuario.ADMIN ||
      usuario.userType === TipoUsuario.GESTOR ||
      (avaliacaoExistente.avaliadorId === session.user.id && avaliacaoExistente.status === StatusAvaliacao.PENDENTE);

    if (!podeEditar) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta avaliação' },
        { status: 403 }
      );
    }

    // Verificar se o período ainda está ativo (para avaliadores comuns)
    if (usuario.userType === TipoUsuario.ATENDENTE) {
      if (avaliacaoExistente.periodo.status !== 'ATIVO') {
        return NextResponse.json(
          { error: 'Período de avaliação não está mais ativo' },
          { status: 400 }
        );
      }

      const agora = new Date();
      if (agora < avaliacaoExistente.periodo.dataInicio || agora > avaliacaoExistente.periodo.dataFim) {
        return NextResponse.json(
          { error: 'Fora do período de avaliação' },
          { status: 400 }
        );
      }
    }

    // Atualizar a avaliação
    const avaliacaoAtualizada = await prisma.avaliacao.update({
      where: { id },
      data: {
        ...dadosValidados,
        atualizadoEm: new Date()
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

    return NextResponse.json(avaliacaoAtualizada);

  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    


    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/avaliacoes/[id] - Deletar avaliação
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

    // Apenas ADMIN e GESTOR podem deletar avaliações
    if (usuario.userType !== TipoUsuario.ADMIN && usuario.userType !== TipoUsuario.GESTOR) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar avaliações' },
        { status: 403 }
      );
    }

    // Atualizar automaticamente os status dos períodos antes de deletar avaliação
    await middlewareAtualizacaoStatus();

    // Verificar se a avaliação existe
    const avaliacaoExistente = await prisma.avaliacao.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!avaliacaoExistente) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    // Deletar a avaliação
    await prisma.avaliacao.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Avaliação deletada com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}