import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { criarUsuarioSchema, listarUsuariosSchema } from '@/lib/validations';
import {
  verificarPermissaoAPI,
  registrarTentativaAcesso,
} from '@/lib/auth/authorization';
import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';

/**
 * GET /api/usuarios - Listar usuários com paginação e filtros
 */
export async function GET(request: NextRequest) {
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
        motivo: 'Permissão insuficiente para visualizar usuários',
      });
      return resposta!;
    }

    // Verificar se o usuário tem permissão para listar usuários
    if (!['ADMIN', 'GESTOR'].includes(session.user.perfil)) {
      return NextResponse.json(
        { erro: 'Sem permissão para listar usuários' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parametros = listarUsuariosSchema.parse({
      pagina: searchParams.get('pagina'),
      limite: searchParams.get('limite'),
      busca: searchParams.get('busca'),
      perfil: searchParams.get('perfil'),
      ativo: searchParams.get('ativo'),
      ordenarPor: searchParams.get('ordenarPor'),
      ordem: searchParams.get('ordem'),
    });

    const { pagina, limite, busca, perfil, ativo, ordenarPor, ordem } =
      parametros;
    const pular = (pagina - 1) * limite;

    // Construir filtros
    const filtros: any = {};

    if (busca) {
      filtros.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { email: { contains: busca, mode: 'insensitive' } },
      ];
    }

    if (perfil) {
      filtros.perfil = perfil;
    }

    if (ativo !== undefined) {
      filtros.ativo = ativo;
    }

    // Buscar usuários com paginação
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where: filtros,
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
        orderBy: { [ordenarPor]: ordem },
        skip: pular,
        take: limite,
      }),
      prisma.usuario.count({ where: filtros }),
    ]);

    const totalPaginas = Math.ceil(total / limite);

    return NextResponse.json({
      usuarios,
      paginacao: {
        paginaAtual: pagina,
        totalPaginas,
        totalItens: total,
        itensPorPagina: limite,
        temProxima: pagina < totalPaginas,
        temAnterior: pagina > 1,
      },
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { erro: 'Parâmetros inválidos', detalhes: error.errors },
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
 * POST /api/usuarios - Criar novo usuário
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autorização
    const { sucesso, usuario, resposta } = await verificarPermissaoAPI(
      request,
      ['criar_usuarios']
    );

    if (!sucesso) {
      await registrarTentativaAcesso({
        usuario,
        rota: request.nextUrl.pathname,
        metodo: request.method,
        ip: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        autorizado: false,
        motivo: 'Permissão insuficiente para criar usuários',
      });
      return resposta!;
    }

    // Verificar se o usuário tem permissão para criar usuários
    if (!['ADMIN', 'GESTOR'].includes(session.user.perfil)) {
      return NextResponse.json(
        { erro: 'Sem permissão para criar usuários' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dadosValidados = criarUsuarioSchema.parse(body);

    // Verificar se o email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: dadosValidados.email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { erro: 'Email já está em uso' },
        { status: 409 }
      );
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(dadosValidados.senha, 12);

    // Criar usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: dadosValidados.nome,
        email: dadosValidados.email,
        senha: senhaHash,
        perfil: dadosValidados.perfil,
        ativo: dadosValidados.ativo,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
      },
    });

    return NextResponse.json(
      {
        mensagem: 'Usuário criado com sucesso',
        usuario: novoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

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
