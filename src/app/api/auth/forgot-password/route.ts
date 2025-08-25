import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Schema de validação para recuperação de senha
const esquemaRecuperacaoSenha = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada
    const { email } = esquemaRecuperacaoSenha.parse(body);

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    // Por segurança, sempre retornamos sucesso mesmo se o email não existir
    // Isso evita que atacantes descubram quais emails estão cadastrados
    if (!usuario) {
      return NextResponse.json(
        {
          message:
            'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
        },
        { status: 200 }
      );
    }

    // Gerar token de recuperação
    const tokenRecuperacao = crypto.randomBytes(32).toString('hex');
    const expiracaoToken = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco de dados
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tokenRecuperacao,
        expiracaoTokenRecuperacao: expiracaoToken,
      },
    });

    // TODO: Implementar envio de email
    // Por enquanto, apenas logamos o token (em produção, isso deve ser removido)
    console.log(`Token de recuperação para ${email}: ${tokenRecuperacao}`);
    console.log(
      `Link de recuperação: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${tokenRecuperacao}`
    );

    return NextResponse.json(
      {
        message:
          'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);

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
