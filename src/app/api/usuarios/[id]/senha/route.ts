import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  idUsuarioSchema,
  alterarSenhaSchema,
  redefinirSenhaSchema,
} from '@/lib/validations';
import bcrypt from 'bcryptjs';

/**
 * PUT /api/usuarios/[id]/senha - Alterar senha do usuário
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const id = idUsuarioSchema.parse(params.id);
    const body = await request.json();

    // Verificar se o usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        ativo: true,
      },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!usuarioExistente.ativo) {
      return NextResponse.json(
        { erro: 'Usuário está inativo' },
        { status: 400 }
      );
    }

    const isProprioUsuario = session.user.id === id;
    const isAdmin = session.user.perfil === 'ADMIN';

    // Se for o próprio usuário, usar schema com senha atual
    if (isProprioUsuario) {
      const dadosValidados = alterarSenhaSchema.parse(body);

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(
        dadosValidados.senhaAtual,
        usuarioExistente.senha
      );

      if (!senhaValida) {
        return NextResponse.json(
          { erro: 'Senha atual incorreta' },
          { status: 400 }
        );
      }

      // Verificar se a nova senha é diferente da atual
      const novaSenhaIgualAtual = await bcrypt.compare(
        dadosValidados.novaSenha,
        usuarioExistente.senha
      );

      if (novaSenhaIgualAtual) {
        return NextResponse.json(
          { erro: 'A nova senha deve ser diferente da senha atual' },
          { status: 400 }
        );
      }

      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(dadosValidados.novaSenha, 12);

      // Atualizar senha
      await prisma.usuario.update({
        where: { id },
        data: {
          senha: novaSenhaHash,
          atualizadoEm: new Date(),
          // Remover flag de primeira alteração se existir
          primeiroAcesso: false,
        },
      });

      return NextResponse.json({
        mensagem: 'Senha alterada com sucesso',
      });
    } else if (isAdmin) {
      // Admin pode redefinir senha sem conhecer a atual
      const dadosValidados = redefinirSenhaSchema.parse(body);

      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(dadosValidados.novaSenha, 12);

      // Atualizar senha
      await prisma.usuario.update({
        where: { id },
        data: {
          senha: novaSenhaHash,
          atualizadoEm: new Date(),
          // Se forçar alteração, marcar para o usuário alterar no próximo login
          primeiroAcesso: dadosValidados.forcarAlteracao,
        },
      });

      return NextResponse.json({
        mensagem: 'Senha redefinida com sucesso',
        forcarAlteracao: dadosValidados.forcarAlteracao,
      });
    } else {
      return NextResponse.json(
        { erro: 'Sem permissão para alterar senha deste usuário' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Erro ao alterar senha:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usuarios/[id]/senha - Gerar senha temporária (admin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins podem gerar senhas temporárias
    if (session.user.perfil !== 'ADMIN') {
      return NextResponse.json(
        { erro: 'Sem permissão para gerar senhas temporárias' },
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

    // Gerar senha temporária
    const senhaTemporaria = Math.random().toString(36).slice(-12) + 'A1!';
    const senhaTemporariaHash = await bcrypt.hash(senhaTemporaria, 12);

    // Atualizar usuário com senha temporária
    await prisma.usuario.update({
      where: { id },
      data: {
        senha: senhaTemporariaHash,
        primeiroAcesso: true, // Forçar alteração no próximo login
        atualizadoEm: new Date(),
      },
    });

    return NextResponse.json({
      mensagem: 'Senha temporária gerada com sucesso',
      senhaTemporaria,
      observacao: 'O usuário deverá alterar esta senha no próximo login',
    });
  } catch (error) {
    console.error('Erro ao gerar senha temporária:', error);

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
