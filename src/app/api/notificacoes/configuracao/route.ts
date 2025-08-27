import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  buscarConfiguracaoNotificacao,
  deveReceberNotificacao
} from '@/lib/utils/notificacoes-avaliacoes';

// Schema para validação da configuração
const configuracaoSchema = z.object({
  usuarioId: z.string(),
  notificacoesEmail: z.boolean(),
  notificacoesInterface: z.boolean(),
  diasAntecedencia: z.number().min(1).max(30),
  horarioEnvio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:mm)'),
  frequenciaLembretes: z.enum(['diario', 'semanal', 'personalizado']),
  ativo: z.boolean()
});

const atualizacaoConfiguracaoSchema = configuracaoSchema.partial().omit({ usuarioId: true });

/**
 * GET /api/notificacoes/configuracao
 * Busca configurações de notificação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId') || session.user.id;

    // Verificar permissões
    const isAdmin = session.user.tipo === 'ADMIN';
    const isGestor = session.user.tipo === 'GESTOR';
    const isProprioUsuario = usuarioId === session.user.id;

    if (!isAdmin && !isGestor && !isProprioUsuario) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar essa configuração' },
        { status: 403 }
      );
    }

    // Buscar configuração
    const configuracao = await buscarConfiguracaoNotificacao(usuarioId);

    if (!configuracao) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissões específicas
    const podeReceberEmail = await deveReceberNotificacao(usuarioId, 'email');
    const podeReceberInterface = await deveReceberNotificacao(usuarioId, 'interface');

    return NextResponse.json({
      configuracao,
      permissoes: {
        email: podeReceberEmail,
        interface: podeReceberInterface
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar configuração de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notificacoes/configuracao
 * Atualiza configurações de notificação do usuário
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { usuarioId, ...dadosAtualizacao } = body;

    // Usar o usuário da sessão se não especificado
    const usuarioAlvo = usuarioId || session.user.id;

    // Verificar permissões
    const isAdmin = session.user.tipo === 'ADMIN';
    const isGestor = session.user.tipo === 'GESTOR';
    const isProprioUsuario = usuarioAlvo === session.user.id;

    if (!isAdmin && !isGestor && !isProprioUsuario) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar essa configuração' },
        { status: 403 }
      );
    }

    // Validar dados
    const dadosValidados = atualizacaoConfiguracaoSchema.parse(dadosAtualizacao);

    // Buscar configuração atual
    const configuracaoAtual = await buscarConfiguracaoNotificacao(usuarioAlvo);
    
    if (!configuracaoAtual) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    // Simular atualização (em uma implementação real, isso seria persistido no banco)
    const configuracaoAtualizada = {
      ...configuracaoAtual,
      ...dadosValidados,
      // Sempre manter o usuarioId original
      usuarioId: configuracaoAtual.usuarioId
    };

    // Validar configuração completa
    const configuracaoCompleta = configuracaoSchema.parse(configuracaoAtualizada);

    // Log da alteração (em produção, isso seria salvo no banco)
    console.log(`Configuração de notificações atualizada para usuário ${usuarioAlvo}:`, {
      alteracoes: dadosValidados,
      usuario: session.user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      configuracao: configuracaoCompleta,
      alteracoes: dadosValidados,
      timestamp: new Date().toISOString(),
      message: 'Configuração atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar configuração de notificações:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notificacoes/configuracao
 * Cria uma nova configuração de notificação
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const body = await request.json();
    
    // Usar o usuário da sessão se não especificado
    const dadosConfiguracao = {
      usuarioId: session.user.id,
      ...body
    };

    // Verificar permissões (apenas admins podem criar configurações para outros usuários)
    if (dadosConfiguracao.usuarioId !== session.user.id && session.user.tipo !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão para criar configuração para outro usuário' },
        { status: 403 }
      );
    }

    // Validar dados
    const configuracaoValidada = configuracaoSchema.parse(dadosConfiguracao);

    // Verificar se já existe configuração
    const configuracaoExistente = await buscarConfiguracaoNotificacao(configuracaoValidada.usuarioId);
    
    if (configuracaoExistente) {
      return NextResponse.json(
        { error: 'Configuração já existe para este usuário. Use PUT para atualizar.' },
        { status: 409 }
      );
    }

    // Simular criação (em uma implementação real, isso seria salvo no banco)
    const novaConfiguracao = {
      ...configuracaoValidada,
      id: `config-${configuracaoValidada.usuarioId}-${Date.now()}`
    };

    // Log da criação
    console.log(`Nova configuração de notificações criada:`, {
      configuracao: novaConfiguracao,
      criadoPor: session.user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      configuracao: novaConfiguracao,
      timestamp: new Date().toISOString(),
      message: 'Configuração criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar configuração de notificações:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notificacoes/configuracao
 * Remove configuração de notificação (desativa)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId') || session.user.id;

    // Verificar permissões
    const isAdmin = session.user.tipo === 'ADMIN';
    const isProprioUsuario = usuarioId === session.user.id;

    if (!isAdmin && !isProprioUsuario) {
      return NextResponse.json(
        { error: 'Sem permissão para remover essa configuração' },
        { status: 403 }
      );
    }

    // Buscar configuração atual
    const configuracaoAtual = await buscarConfiguracaoNotificacao(usuarioId);
    
    if (!configuracaoAtual) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    // Em vez de deletar, desativar a configuração
    const configuracaoDesativada = {
      ...configuracaoAtual,
      ativo: false,
      notificacoesEmail: false,
      notificacoesInterface: false
    };

    // Log da desativação
    console.log(`Configuração de notificações desativada:`, {
      usuarioId,
      desativadoPor: session.user.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      configuracao: configuracaoDesativada,
      timestamp: new Date().toISOString(),
      message: 'Configuração desativada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar configuração de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}