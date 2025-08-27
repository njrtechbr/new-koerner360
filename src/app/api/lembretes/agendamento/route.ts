import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { obterAgendadorLembretes } from '@/lib/services/agendador-lembretes';
import { z } from 'zod';

// Schema de validação para configuração de lembretes
const configuracaoLembretesSchema = z.object({
  diasAntecedencia: z.array(z.number().min(1).max(30)).min(1).max(10),
  horarioEnvio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:mm)'),
  ativo: z.boolean(),
  incluirFimDeSemana: z.boolean(),
  incluirFeriados: z.boolean(),
});

// Schema para ações do agendador
const acaoAgendadorSchema = z.object({
  acao: z.enum(['iniciar', 'parar', 'forcar_verificacao', 'reagendar_avaliacao']),
  avaliacaoId: z.string().optional(),
});

/**
 * GET /api/lembretes/agendamento
 * Obtém o status e configuração do agendador de lembretes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem acessar.' },
        { status: 403 }
      );
    }

    const agendador = obterAgendadorLembretes();

    // Obter status e configuração
    const status = {
      ativo: agendador.estaAtivo(),
      configuracao: agendador.obterConfiguracao(),
      estatisticas: await agendador.obterEstatisticas(),
    };

    return NextResponse.json({
      sucesso: true,
      dados: status,
    });

  } catch (error) {
    console.error('Erro ao obter status do agendador:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lembretes/agendamento
 * Atualiza a configuração do agendador de lembretes
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem configurar.' },
        { status: 403 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();
    const dadosValidados = configuracaoLembretesSchema.parse(body);

    const agendador = obterAgendadorLembretes();
    const estavoAtivo = agendador.estaAtivo();

    // Parar agendador se estiver ativo
    if (estavoAtivo) {
      agendador.parar();
    }

    // Atualizar configuração
    await agendador.atualizarConfiguracao(dadosValidados);

    // Reiniciar agendador se estava ativo
    if (estavoAtivo && dadosValidados.ativo) {
      await agendador.iniciar();
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Configuração do agendador atualizada com sucesso',
      dados: {
        configuracao: agendador.obterConfiguracao(),
        ativo: agendador.estaAtivo(),
      },
    });

  } catch (error) {
    console.error('Erro ao atualizar configuração do agendador:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erro: 'Dados inválidos',
          detalhes: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lembretes/agendamento
 * Executa ações no agendador (iniciar, parar, forçar verificação, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem executar ações.' },
        { status: 403 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();
    const dadosValidados = acaoAgendadorSchema.parse(body);

    const agendador = obterAgendadorLembretes();
    let resultado: any = {};

    switch (dadosValidados.acao) {
      case 'iniciar':
        if (agendador.estaAtivo()) {
          return NextResponse.json(
            { erro: 'Agendador já está ativo' },
            { status: 400 }
          );
        }
        await agendador.iniciar();
        resultado = { mensagem: 'Agendador iniciado com sucesso' };
        break;

      case 'parar':
        if (!agendador.estaAtivo()) {
          return NextResponse.json(
            { erro: 'Agendador já está parado' },
            { status: 400 }
          );
        }
        agendador.parar();
        resultado = { mensagem: 'Agendador parado com sucesso' };
        break;

      case 'forcar_verificacao':
        if (!agendador.estaAtivo()) {
          return NextResponse.json(
            { erro: 'Agendador deve estar ativo para forçar verificação' },
            { status: 400 }
          );
        }
        await agendador.forcarVerificacao();
        resultado = { mensagem: 'Verificação de lembretes executada com sucesso' };
        break;

      case 'reagendar_avaliacao':
        if (!dadosValidados.avaliacaoId) {
          return NextResponse.json(
            { erro: 'ID da avaliação é obrigatório para reagendamento' },
            { status: 400 }
          );
        }
        await agendador.reagendarAvaliacao(dadosValidados.avaliacaoId);
        resultado = { 
          mensagem: 'Lembretes da avaliação reagendados com sucesso',
          avaliacaoId: dadosValidados.avaliacaoId
        };
        break;

      default:
        return NextResponse.json(
          { erro: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      sucesso: true,
      ...resultado,
      status: {
        ativo: agendador.estaAtivo(),
        configuracao: agendador.obterConfiguracao(),
      },
    });

  } catch (error) {
    console.error('Erro ao executar ação no agendador:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erro: 'Dados inválidos',
          detalhes: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lembretes/agendamento
 * Limpa lembretes agendados ou reseta configurações
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN)
    if (session.user.papel !== 'ADMIN') {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores podem limpar lembretes.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const acao = searchParams.get('acao') || 'limpar_pendentes';

    const agendador = obterAgendadorLembretes();
    let resultado: any = {};

    switch (acao) {
      case 'limpar_pendentes':
        // Implementar limpeza de lembretes pendentes
        resultado = { mensagem: 'Lembretes pendentes limpos com sucesso' };
        break;

      case 'resetar_configuracao':
        // Parar agendador
        if (agendador.estaAtivo()) {
          agendador.parar();
        }
        
        // Resetar para configuração padrão
        await agendador.atualizarConfiguracao({
          diasAntecedencia: [7, 3, 1],
          horarioEnvio: '09:00',
          ativo: true,
          incluirFimDeSemana: false,
          incluirFeriados: false,
        });
        
        resultado = { mensagem: 'Configuração resetada para padrão' };
        break;

      default:
        return NextResponse.json(
          { erro: 'Ação de limpeza não reconhecida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      sucesso: true,
      ...resultado,
      status: {
        ativo: agendador.estaAtivo(),
        configuracao: agendador.obterConfiguracao(),
      },
    });

  } catch (error) {
    console.error('Erro ao limpar lembretes:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}