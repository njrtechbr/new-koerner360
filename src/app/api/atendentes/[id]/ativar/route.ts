import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  idAtendenteSchema,
  ativarAtendenteSchema,
  MENSAGENS_ERRO_ATENDENTES,
} from '@/lib/validations/atendentes';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/atendentes/[id]/ativar
 * Ativa um atendente inativo
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN pode ativar atendentes)
    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar ID
    const atendenteId = idAtendenteSchema.parse(params.id);

    // Buscar atendente com dados do usuário
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true,
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

    // Verificar se o atendente já está ativo
    if (atendente.status === 'ATIVO' && atendente.usuario.ativo) {
      return NextResponse.json(
        { erro: 'Atendente já está ativo' },
        { status: 400 }
      );
    }

    // Extrair dados do corpo da requisição
    const dadosRequisicao = await request.json();

    // Validar dados
    const { motivo, novoStatus } = ativarAtendenteSchema.parse(dadosRequisicao);

    // Salvar dados anteriores para o histórico
    const dadosAnteriores = {
      statusAtendente: atendente.status,
      usuarioAtivo: atendente.usuario.ativo,
    };

    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async tx => {
      // Ativar usuário
      const usuarioAtualizado = await tx.usuario.update({
        where: { id: atendente.usuarioId },
        data: { ativo: true },
      });

      // Atualizar status do atendente
      const atendenteAtualizado = await tx.atendente.update({
        where: { id: atendenteId },
        data: { status: novoStatus },
      });

      // Registrar no histórico de alterações
      await tx.historicoAlteracaoAtendente.create({
        data: {
          atendenteId,
          tipo: 'ATIVACAO',
          descricao: `Atendente reativado - ${motivo}`,
          valorAnterior: JSON.stringify(dadosAnteriores),
          valorNovo: JSON.stringify({
            statusAtendente: novoStatus,
            usuarioAtivo: true,
            motivo,
          }),
          criadoPorId: session.user.id,
        },
      });

      return {
        atendente: atendenteAtualizado,
        usuario: usuarioAtualizado,
      };
    });

    return NextResponse.json({
      mensagem: 'Atendente ativado com sucesso',
      atendente: {
        id: resultado.atendente.id,
        status: resultado.atendente.status,
        usuario: {
          id: resultado.usuario.id,
          nome: resultado.usuario.nome,
          email: resultado.usuario.email,
          ativo: resultado.usuario.ativo,
        },
        ativadoEm: new Date().toISOString(),
        ativadoPor: {
          id: session.user.id,
          nome: session.user.name,
        },
        motivo,
      },
    });
  } catch (error) {
    console.error('Erro ao ativar atendente:', error);

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
