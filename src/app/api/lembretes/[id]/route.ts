import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para atualização de lembrete
const atualizarLembreteSchema = z.object({
  dataEnvio: z.string().optional(),
  observacoes: z.string().optional(),
  enviado: z.boolean().optional(),
  erro: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/lembretes/[id]
 * Busca um lembrete específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Buscar o lembrete
    const lembrete = await prisma.lembreteAgendado.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
          },
        },
        avaliacao: {
          select: {
            id: true,
            prazo: true,
            status: true,
            avaliado: {
              select: {
                id: true,
                nome: true,
                cargo: true,
                email: true,
              },
            },
            avaliador: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            periodo: {
              select: {
                id: true,
                nome: true,
                dataInicio: true,
                dataFim: true,
              },
            },
          },
        },
        criadoPorUsuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!lembrete) {
      return NextResponse.json(
        { erro: 'Lembrete não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    const podeVer = 
      ['ADMIN', 'GESTOR'].includes(session.user.papel) ||
      lembrete.usuarioId === session.user.id ||
      lembrete.avaliacao.avaliadorId === session.user.id;

    if (!podeVer) {
      return NextResponse.json(
        { erro: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      dados: lembrete,
    });

  } catch (error) {
    console.error('Erro ao buscar lembrete:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lembretes/[id]
 * Atualiza um lembrete específico
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem atualizar lembretes.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar se o lembrete existe
    const lembreteExistente = await prisma.lembreteAgendado.findUnique({
      where: { id },
    });

    if (!lembreteExistente) {
      return NextResponse.json(
        { erro: 'Lembrete não encontrado' },
        { status: 404 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();
    const dadosValidados = atualizarLembreteSchema.parse(body);

    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      atualizadoEm: new Date(),
      atualizadoPor: session.user.id,
    };

    if (dadosValidados.dataEnvio) {
      dadosAtualizacao.dataEnvio = new Date(dadosValidados.dataEnvio);
    }

    if (dadosValidados.observacoes !== undefined) {
      dadosAtualizacao.observacoes = dadosValidados.observacoes;
    }

    if (dadosValidados.enviado !== undefined) {
      dadosAtualizacao.enviado = dadosValidados.enviado;
      
      // Se marcando como enviado, atualizar data de envio
      if (dadosValidados.enviado && !lembreteExistente.enviado) {
        dadosAtualizacao.dataEnvioReal = new Date();
        dadosAtualizacao.tentativas = lembreteExistente.tentativas + 1;
      }
    }

    if (dadosValidados.erro !== undefined) {
      dadosAtualizacao.erro = dadosValidados.erro;
      dadosAtualizacao.ultimaTentativa = new Date();
      dadosAtualizacao.tentativas = lembreteExistente.tentativas + 1;
    }

    // Atualizar o lembrete
    const lembreteAtualizado = await prisma.lembreteAgendado.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        avaliacao: {
          select: {
            id: true,
            prazo: true,
            status: true,
            avaliado: {
              select: {
                nome: true,
                cargo: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Lembrete atualizado com sucesso',
      dados: lembreteAtualizado,
    });

  } catch (error) {
    console.error('Erro ao atualizar lembrete:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erro: 'Dados inválidos',
          detalhes: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lembretes/[id]
 * Remove um lembrete específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem remover lembretes.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar se o lembrete existe
    const lembreteExistente = await prisma.lembreteAgendado.findUnique({
      where: { id },
      include: {
        avaliacao: {
          select: {
            id: true,
            status: true,
            avaliado: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!lembreteExistente) {
      return NextResponse.json(
        { erro: 'Lembrete não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o lembrete pode ser removido
    if (lembreteExistente.enviado) {
      return NextResponse.json(
        { erro: 'Não é possível remover lembretes que já foram enviados' },
        { status: 400 }
      );
    }

    // Remover o lembrete
    await prisma.lembreteAgendado.delete({
      where: { id },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Lembrete removido com sucesso',
      dados: {
        id: lembreteExistente.id,
        avaliacaoId: lembreteExistente.avaliacaoId,
        tipo: lembreteExistente.tipo,
      },
    });

  } catch (error) {
    console.error('Erro ao remover lembrete:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lembretes/[id]
 * Executa ações específicas no lembrete (reenviar, marcar como enviado, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem executar ações em lembretes.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { acao } = body;

    // Verificar se o lembrete existe
    const lembrete = await prisma.lembreteAgendado.findUnique({
      where: { id },
      include: {
        avaliacao: {
          include: {
            avaliador: true,
            avaliado: true,
            periodo: true,
          },
        },
      },
    });

    if (!lembrete) {
      return NextResponse.json(
        { erro: 'Lembrete não encontrado' },
        { status: 404 }
      );
    }

    let resultado: any = {};

    switch (acao) {
      case 'reenviar':
        // Implementar reenvio do lembrete
        await prisma.lembreteAgendado.update({
          where: { id },
          data: {
            tentativas: lembrete.tentativas + 1,
            ultimaTentativa: new Date(),
            erro: null,
          },
        });
        
        resultado = {
          mensagem: 'Lembrete reagendado para reenvio',
          acao: 'reenviar',
        };
        break;

      case 'marcar_enviado':
        if (lembrete.enviado) {
          return NextResponse.json(
            { erro: 'Lembrete já foi marcado como enviado' },
            { status: 400 }
          );
        }
        
        await prisma.lembreteAgendado.update({
          where: { id },
          data: {
            enviado: true,
            dataEnvioReal: new Date(),
            tentativas: lembrete.tentativas + 1,
            erro: null,
          },
        });
        
        resultado = {
          mensagem: 'Lembrete marcado como enviado',
          acao: 'marcar_enviado',
        };
        break;

      case 'reagendar':
        const { novaData } = body;
        if (!novaData) {
          return NextResponse.json(
            { erro: 'Nova data é obrigatória para reagendamento' },
            { status: 400 }
          );
        }
        
        await prisma.lembreteAgendado.update({
          where: { id },
          data: {
            dataEnvio: new Date(novaData),
            enviado: false,
            erro: null,
          },
        });
        
        resultado = {
          mensagem: 'Lembrete reagendado com sucesso',
          acao: 'reagendar',
          novaData,
        };
        break;

      default:
        return NextResponse.json(
          { erro: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      sucesso: true,
      ...resultado,
      dados: {
        id: lembrete.id,
        avaliacaoId: lembrete.avaliacaoId,
        tipo: lembrete.tipo,
      },
    });

  } catch (error) {
    console.error('Erro ao executar ação no lembrete:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}