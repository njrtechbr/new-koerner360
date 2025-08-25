import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { idUsuarioSchema } from '@/lib/validations';

/**
 * PATCH /api/usuarios/[id]/ativar - Ativar/reativar usuário
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins e gestores podem ativar usuários
    if (!['ADMIN', 'GESTOR'].includes(session.user.perfil)) {
      return NextResponse.json(
        { erro: 'Sem permissão para ativar usuários' },
        { status: 403 }
      );
    }

    const id = idUsuarioSchema.parse(params.id);

    // Verificar se o usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário já está ativo
    if (usuarioExistente.ativo) {
      return NextResponse.json(
        { erro: 'Usuário já está ativo' },
        { status: 400 }
      );
    }

    // Ativar usuário
    const usuarioAtivado = await prisma.usuario.update({
      where: { id },
      data: {
        ativo: true,
        atualizadoEm: new Date(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        atualizadoEm: true,
      },
    });

    return NextResponse.json({
      mensagem: 'Usuário ativado com sucesso',
      usuario: usuarioAtivado,
    });
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { erro: 'ID inválido', detalhes: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
