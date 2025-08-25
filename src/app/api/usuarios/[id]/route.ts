import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { atualizarUsuarioSchema, idUsuarioSchema } from '@/lib/validations';
import {
  verificarPermissaoAPI,
  registrarTentativaAcesso,
} from '@/lib/auth/authorization';
import bcrypt from 'bcryptjs';

/**
 * GET /api/usuarios/[id] - Obter detalhes de um usuário específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autorização
    const { sucesso, usuario, resposta } = await verificarPermissaoAPI(
      request,
      ['visualizar_usuarios']
    );

    if (!sucesso) {
      await registrarTentativaAcesso({
        usuario,
        rota: request.nextUrl.pathname,
        metodo: request.method,
        ip: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        autorizado: false,
        motivo: 'Permissão insuficiente para visualizar usuário',
      });
      return resposta!;
    }

    const id = idUsuarioSchema.parse(params.id);

    // Verificar se pode ver este usuário específico (próprios dados ou permissão admin/gestor)
    const podeVerUsuario =
      usuario!.id === id || ['ADMIN', 'GESTOR'].includes(usuario!.userType);

    if (!podeVerUsuario) {
      await registrarTentativaAcesso({
        usuario,
        rota: request.nextUrl.pathname,
        metodo: request.method,
        ip: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        autorizado: false,
        motivo: `Tentativa de visualizar dados de outro usuário (ID: ${id})`,
      });
      return NextResponse.json(
        { erro: 'Sem permissão para visualizar este usuário' },
        { status: 403 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
        ultimoLogin: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);

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

/**
 * PUT /api/usuarios/[id] - Atualizar dados de um usuário
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autorização
    const { sucesso, usuario, resposta } = await verificarPermissaoAPI(
      request,
      ['editar_usuarios']
    );

    if (!sucesso) {
      await registrarTentativaAcesso({
        usuario,
        rota: request.nextUrl.pathname,
        metodo: request.method,
        ip: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        autorizado: false,
        motivo: 'Permissão insuficiente para editar usuários',
      });
      return resposta!;
    }

    const id = idUsuarioSchema.parse(params.id);
    const body = await request.json();
    const dadosValidados = atualizarUsuarioSchema.parse(body);

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

    // Verificar permissões
    const podeEditarUsuario =
      session.user.id === id ||
      ['ADMIN', 'GESTOR'].includes(session.user.perfil);

    if (!podeEditarUsuario) {
      return NextResponse.json(
        { erro: 'Sem permissão para editar este usuário' },
        { status: 403 }
      );
    }

    // Se não for admin, não pode alterar perfil
    if (dadosValidados.perfil && session.user.perfil !== 'ADMIN') {
      return NextResponse.json(
        { erro: 'Apenas administradores podem alterar perfis' },
        { status: 403 }
      );
    }

    // Verificar se o email já está em uso por outro usuário
    if (dadosValidados.email) {
      const emailEmUso = await prisma.usuario.findFirst({
        where: {
          email: dadosValidados.email,
          id: { not: id },
        },
      });

      if (emailEmUso) {
        return NextResponse.json(
          { erro: 'Email já está em uso por outro usuário' },
          { status: 409 }
        );
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      ...dadosValidados,
      atualizadoEm: new Date(),
    };

    // Criptografar nova senha se fornecida
    if (dadosValidados.senha) {
      dadosAtualizacao.senha = await bcrypt.hash(dadosValidados.senha, 12);
    }

    // Atualizar usuário
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    return NextResponse.json({
      mensagem: 'Usuário atualizado com sucesso',
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

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
 * DELETE /api/usuarios/[id] - Desativar usuário (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autorização
    const { sucesso, usuario, resposta } = await verificarPermissaoAPI(
      request,
      ['excluir_usuarios']
    );

    if (!sucesso) {
      await registrarTentativaAcesso({
        usuario,
        rota: request.nextUrl.pathname,
        metodo: request.method,
        ip: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        autorizado: false,
        motivo: 'Permissão insuficiente para excluir usuários',
      });
      return resposta!;
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

    // Não permitir que o usuário desative a si mesmo
    if (session.user.id === id) {
      return NextResponse.json(
        { erro: 'Não é possível desativar sua própria conta' },
        { status: 400 }
      );
    }

    // Realizar soft delete (desativar usuário)
    const usuarioDesativado = await prisma.usuario.update({
      where: { id },
      data: {
        ativo: false,
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
      mensagem: 'Usuário desativado com sucesso',
      usuario: usuarioDesativado,
    });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);

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
