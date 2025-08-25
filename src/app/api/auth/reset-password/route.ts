import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Schema de validação para redefinição de senha
const esquemaRedefinicaoSenha = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  novaSenha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada
    const { token, novaSenha } = esquemaRedefinicaoSenha.parse(body);

    // Verificar se o token existe e não expirou
    const usuario = await prisma.usuario.findFirst({
      where: {
        tokenRecuperacao: token,
        expiracaoTokenRecuperacao: {
          gt: new Date(), // Token ainda não expirou
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 12);

    // Atualizar a senha e limpar o token de recuperação
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        tokenRecuperacao: null,
        expiracaoTokenRecuperacao: null,
      },
    });

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro na redefinição de senha:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
