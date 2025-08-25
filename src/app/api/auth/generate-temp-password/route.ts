import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Schema de validação para geração de senha temporária
const esquemaGerarSenhaTemporaria = z.object({
  email: z.string().email('Email inválido'),
  adminKey: z.string().min(1, 'Chave de administrador é obrigatória'),
});

// Função para gerar senha temporária
function gerarSenhaTemporaria(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let senha = '';
  for (let i = 0; i < 8; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return senha;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada
    const { email, adminKey } = esquemaGerarSenhaTemporaria.parse(body);

    // Verificar chave de administrador (em produção, usar uma chave mais segura)
    if (adminKey !== process.env.ADMIN_TEMP_PASSWORD_KEY) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar senha temporária
    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 12);

    // Gerar token de expiração (24 horas)
    const tokenExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Atualizar usuário com senha temporária
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        tokenRecuperacao: crypto.randomBytes(16).toString('hex'), // Usar como flag de senha temporária
        expiracaoTokenRecuperacao: tokenExpiracao,
      },
    });

    // TODO: Implementar envio de email com a senha temporária
    // Por enquanto, apenas logamos a senha (em produção, isso deve ser removido)
    console.log(`Senha temporária para ${email}: ${senhaTemporaria}`);
    console.log(`A senha expira em: ${tokenExpiracao.toLocaleString('pt-BR')}`);

    return NextResponse.json(
      {
        message: 'Senha temporária gerada com sucesso',
        senhaTemporaria, // Em produção, remover este campo
        expiraEm: tokenExpiracao,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro na geração de senha temporária:', error);

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
