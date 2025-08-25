import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validação para verificação de token
const esquemaVerificacaoToken = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada
    const { token } = esquemaVerificacaoToken.parse(body);

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

    return NextResponse.json({ message: 'Token válido' }, { status: 200 });
  } catch (error) {
    console.error('Erro na verificação de token:', error);

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
