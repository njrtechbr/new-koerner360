import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verificarPermissao } from '@/lib/utils/permissoes';

// Schema de validação para configuração de e-mail
const configuracaoEmailSchema = z.object({
  emailsAtivos: z.boolean(),
  emailPrincipal: z.string().email().optional(),
  emailsAdicionais: z.array(z.string().email()).optional(),
  frequenciaNotificacao: z.enum(['imediata', 'diaria', 'semanal']),
  tiposNotificacao: z.object({
    avaliacaoPendente: z.boolean(),
    lembreteVencimento: z.boolean(),
    avaliacaoVencida: z.boolean(),
    resumoSemanal: z.boolean(),
  }),
  horarioPreferido: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  diasAntecedencia: z.number().min(1).max(30),
  formatoHtml: z.boolean(),
  incluirResumo: z.boolean(),
  assinaturaPersonalizada: z.string().max(500).optional(),
});

// GET - Buscar configuração de e-mail do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId') || session.user.id;

    // Verificar permissões
    if (usuarioId !== session.user.id) {
      const temPermissao = await verificarPermissao(
        session.user.id,
        ['ADMIN', 'GESTOR']
      );
      
      if (!temPermissao) {
        return NextResponse.json(
          { erro: 'Sem permissão para acessar configurações de outro usuário' },
          { status: 403 }
        );
      }
    }

    // Buscar configuração existente
    const configuracao = await prisma.configuracaoEmailNotificacao.findUnique({
      where: { usuarioId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!configuracao) {
      // Retornar configuração padrão se não existir
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, nome: true, email: true },
      });

      if (!usuario) {
        return NextResponse.json(
          { erro: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        configuracao: {
          usuarioId,
          emailsAtivos: false,
          emailPrincipal: usuario.email,
          emailsAdicionais: [],
          frequenciaNotificacao: 'diaria',
          tiposNotificacao: {
            avaliacaoPendente: true,
            lembreteVencimento: true,
            avaliacaoVencida: true,
            resumoSemanal: false,
          },
          horarioPreferido: '09:00',
          diasAntecedencia: 3,
          formatoHtml: true,
          incluirResumo: true,
          assinaturaPersonalizada: null,
          ativo: true,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        },
        usuario,
      });
    }

    return NextResponse.json({
      configuracao,
      usuario: configuracao.usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar configuração de e-mail:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configuração de e-mail
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { usuarioId, ...dadosConfiguracao } = body;
    const usuarioAlvo = usuarioId || session.user.id;

    // Verificar permissões
    if (usuarioAlvo !== session.user.id) {
      const temPermissao = await verificarPermissao(
        session.user.id,
        ['ADMIN', 'GESTOR']
      );
      
      if (!temPermissao) {
        return NextResponse.json(
          { erro: 'Sem permissão para alterar configurações de outro usuário' },
          { status: 403 }
        );
      }
    }

    // Validar dados
    const dadosValidados = configuracaoEmailSchema.parse(dadosConfiguracao);

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioAlvo },
    });

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar ou criar configuração
    const configuracao = await prisma.configuracaoEmailNotificacao.upsert({
      where: { usuarioId: usuarioAlvo },
      update: {
        ...dadosValidados,
        atualizadoEm: new Date(),
      },
      create: {
        usuarioId: usuarioAlvo,
        ...dadosValidados,
        ativo: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      configuracao,
      mensagem: 'Configuração de e-mail atualizada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          erro: 'Dados inválidos',
          detalhes: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar configuração de e-mail:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova configuração de e-mail
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { usuarioId, ...dadosConfiguracao } = body;
    const usuarioAlvo = usuarioId || session.user.id;

    // Verificar permissões
    if (usuarioAlvo !== session.user.id) {
      const temPermissao = await verificarPermissao(
        session.user.id,
        ['ADMIN']
      );
      
      if (!temPermissao) {
        return NextResponse.json(
          { erro: 'Sem permissão para criar configurações para outro usuário' },
          { status: 403 }
        );
      }
    }

    // Validar dados
    const dadosValidados = configuracaoEmailSchema.parse(dadosConfiguracao);

    // Verificar se já existe configuração
    const configuracaoExistente = await prisma.configuracaoEmailNotificacao.findUnique({
      where: { usuarioId: usuarioAlvo },
    });

    if (configuracaoExistente) {
      return NextResponse.json(
        { erro: 'Configuração de e-mail já existe para este usuário' },
        { status: 409 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioAlvo },
    });

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Criar configuração
    const configuracao = await prisma.configuracaoEmailNotificacao.create({
      data: {
        usuarioId: usuarioAlvo,
        ...dadosValidados,
        ativo: true,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        configuracao,
        mensagem: 'Configuração de e-mail criada com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          erro: 'Dados inválidos',
          detalhes: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Erro ao criar configuração de e-mail:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar configuração de e-mail
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId') || session.user.id;

    // Verificar permissões
    if (usuarioId !== session.user.id) {
      const temPermissao = await verificarPermissao(
        session.user.id,
        ['ADMIN']
      );
      
      if (!temPermissao) {
        return NextResponse.json(
          { erro: 'Sem permissão para desativar configurações de outro usuário' },
          { status: 403 }
        );
      }
    }

    // Verificar se a configuração existe
    const configuracao = await prisma.configuracaoEmailNotificacao.findUnique({
      where: { usuarioId },
    });

    if (!configuracao) {
      return NextResponse.json(
        { erro: 'Configuração de e-mail não encontrada' },
        { status: 404 }
      );
    }

    // Desativar configuração (não deletar)
    const configuracaoAtualizada = await prisma.configuracaoEmailNotificacao.update({
      where: { usuarioId },
      data: {
        ativo: false,
        emailsAtivos: false,
        atualizadoEm: new Date(),
      },
    });

    return NextResponse.json({
      configuracao: configuracaoAtualizada,
      mensagem: 'Configuração de e-mail desativada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desativar configuração de e-mail:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}