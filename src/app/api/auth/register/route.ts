import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { TipoUsuario } from '@/lib/types';
import { z } from 'zod';

// Schema de validação para o registro
const registroSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').toLowerCase(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  userType: z.enum(['ADMIN', 'GESTOR', 'ATENDENTE'], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados de entrada
    const validacao = registroSchema.safeParse(body);

    if (!validacao.success) {
      const erros = validacao.error.errors.map(err => err.message).join(', ');
      return NextResponse.json(
        { message: `Dados inválidos: ${erros}` },
        { status: 400 }
      );
    }

    const { nome, email, senha, userType } = validacao.data;

    // Verificar se o usuário já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { message: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    // Gerar hash da senha
    const saltRounds = 12;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Criar o usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email,
        senha: senhaHash,
        userType: userType as TipoUsuario,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        userType: true,
        ativo: true,
        criadoEm: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        usuario: novoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    // Verificar se é erro de constraint única do Prisma
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
