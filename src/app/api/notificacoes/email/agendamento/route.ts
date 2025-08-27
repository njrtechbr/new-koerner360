import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { verificarPermissao } from '@/lib/utils/permissoes';
import { AgendadorEmail } from '@/lib/services/agendador-email';

// Schema de validação para configuração do agendador
const configuracaoAgendadorSchema = z.object({
  ativo: z.boolean(),
  intervaloVerificacao: z.number().min(60000).max(86400000), // 1 minuto a 24 horas em ms
  horarioExpediente: z.object({
    inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }),
  diasUteis: z.array(z.number().min(0).max(6)).min(1).max(7),
  maxTentativas: z.number().min(1).max(10),
  delayEntreTentativas: z.number().min(1000).max(3600000), // 1 segundo a 1 hora em ms
  maxTarefasSimultaneas: z.number().min(1).max(50),
  prioridadeMaxima: z.enum(['baixa', 'normal', 'alta', 'urgente']),
});

// Schema para agendar tarefa específica
const agendarTarefaSchema = z.object({
  tipo: z.enum(['avaliacao_pendente', 'lembrete_prazo', 'avaliacao_vencida', 'resumo_semanal']),
  destinatarios: z.array(z.object({
    usuarioId: z.string(),
    email: z.string().email(),
    nome: z.string(),
  })).min(1),
  dadosPersonalizacao: z.object({
    avaliacaoId: z.string().optional(),
    nomeAvaliacao: z.string().optional(),
    prazoVencimento: z.string().optional(),
    diasRestantes: z.number().optional(),
    urlAvaliacao: z.string().optional(),
    estatisticas: z.object({
      totalPendentes: z.number().optional(),
      totalVencidas: z.number().optional(),
      totalConcluidas: z.number().optional(),
    }).optional(),
  }).optional(),
  agendarPara: z.string().datetime(),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  tentativas: z.number().min(1).max(10).default(3),
});

// Instância singleton do agendador
let agendadorInstance: AgendadorEmail | null = null;

function obterAgendador(): AgendadorEmail {
  if (!agendadorInstance) {
    agendadorInstance = new AgendadorEmail({
      ativo: false,
      intervaloVerificacao: 300000, // 5 minutos
      horarioExpediente: {
        inicio: '08:00',
        fim: '18:00',
      },
      diasUteis: [1, 2, 3, 4, 5], // Segunda a sexta
      maxTentativas: 3,
      delayEntreTentativas: 60000, // 1 minuto
      maxTarefasSimultaneas: 10,
      prioridadeMaxima: 'urgente',
    });
  }
  return agendadorInstance;
}

// GET - Obter status e configuração do agendador
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    const temPermissao = await verificarPermissao(
      session.user.id,
      ['ADMIN', 'GESTOR']
    );
    
    if (!temPermissao) {
      return NextResponse.json(
        { erro: 'Sem permissão para visualizar agendador de e-mails' },
        { status: 403 }
      );
    }

    const agendador = obterAgendador();
    const { searchParams } = new URL(request.url);
    const incluirEstatisticas = searchParams.get('estatisticas') === 'true';
    const incluirTarefas = searchParams.get('tarefas') === 'true';

    const status = {
      ativo: agendador.estaAtivo(),
      configuracao: agendador.obterConfiguracao(),
    };

    if (incluirEstatisticas) {
      status.estatisticas = agendador.obterEstatisticas();
    }

    if (incluirTarefas) {
      status.tarefasPendentes = agendador.obterTarefasPendentes();
    }

    return NextResponse.json({
      status,
      mensagem: 'Status do agendador obtido com sucesso',
    });

  } catch (error) {
    console.error('Erro ao obter status do agendador:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configuração do agendador
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN pode alterar configurações)
    const temPermissao = await verificarPermissao(
      session.user.id,
      ['ADMIN']
    );
    
    if (!temPermissao) {
      return NextResponse.json(
        { erro: 'Sem permissão para alterar configurações do agendador' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dadosValidados = configuracaoAgendadorSchema.parse(body);

    const agendador = obterAgendador();
    
    // Parar agendador se estiver ativo
    if (agendador.estaAtivo()) {
      agendador.parar();
    }

    // Atualizar configuração
    agendador.atualizarConfiguracao(dadosValidados);

    // Reiniciar se deve estar ativo
    if (dadosValidados.ativo) {
      agendador.iniciar();
    }

    return NextResponse.json({
      configuracao: agendador.obterConfiguracao(),
      ativo: agendador.estaAtivo(),
      mensagem: 'Configuração do agendador atualizada com sucesso',
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

    console.error('Erro ao atualizar configuração do agendador:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Agendar nova tarefa de e-mail
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    const temPermissao = await verificarPermissao(
      session.user.id,
      ['ADMIN', 'GESTOR']
    );
    
    if (!temPermissao) {
      return NextResponse.json(
        { erro: 'Sem permissão para agendar e-mails' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const acao = searchParams.get('acao');

    const agendador = obterAgendador();

    if (acao === 'iniciar') {
      // Iniciar agendador
      if (agendador.estaAtivo()) {
        return NextResponse.json(
          { erro: 'Agendador já está ativo' },
          { status: 400 }
        );
      }

      agendador.iniciar();
      
      return NextResponse.json({
        ativo: true,
        mensagem: 'Agendador iniciado com sucesso',
      });

    } else if (acao === 'parar') {
      // Parar agendador
      if (!agendador.estaAtivo()) {
        return NextResponse.json(
          { erro: 'Agendador já está inativo' },
          { status: 400 }
        );
      }

      agendador.parar();
      
      return NextResponse.json({
        ativo: false,
        mensagem: 'Agendador parado com sucesso',
      });

    } else if (acao === 'agendar-automatico') {
      // Agendar notificações automáticas
      const resultado = await agendador.agendarNotificacoesAutomaticas();
      
      return NextResponse.json({
        resultado,
        mensagem: `${resultado.tarefasAgendadas} tarefas agendadas automaticamente`,
      });

    } else if (acao === 'agendar-resumo') {
      // Agendar resumo semanal
      const resultado = await agendador.agendarResumoSemanal();
      
      return NextResponse.json({
        resultado,
        mensagem: `${resultado.tarefasAgendadas} resumos semanais agendados`,
      });

    } else {
      // Agendar tarefa específica
      const dadosValidados = agendarTarefaSchema.parse(body);
      
      const tarefaId = await agendador.agendarTarefa(
        dadosValidados.tipo,
        dadosValidados.destinatarios,
        dadosValidados.dadosPersonalizacao || {},
        new Date(dadosValidados.agendarPara),
        dadosValidados.prioridade,
        dadosValidados.tentativas
      );

      return NextResponse.json(
        {
          tarefaId,
          mensagem: 'Tarefa agendada com sucesso',
        },
        { status: 201 }
      );
    }

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

    console.error('Erro ao processar agendamento:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar tarefa agendada
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    const temPermissao = await verificarPermissao(
      session.user.id,
      ['ADMIN', 'GESTOR']
    );
    
    if (!temPermissao) {
      return NextResponse.json(
        { erro: 'Sem permissão para cancelar tarefas agendadas' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tarefaId = searchParams.get('tarefaId');
    const limparTodas = searchParams.get('limparTodas') === 'true';

    const agendador = obterAgendador();

    if (limparTodas) {
      // Limpar todas as tarefas
      const resultado = agendador.limparTarefas();
      
      return NextResponse.json({
        tarefasRemovidas: resultado.tarefasRemovidas,
        mensagem: `${resultado.tarefasRemovidas} tarefas removidas`,
      });

    } else if (tarefaId) {
      // Cancelar tarefa específica
      const sucesso = agendador.cancelarTarefa(tarefaId);
      
      if (!sucesso) {
        return NextResponse.json(
          { erro: 'Tarefa não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        tarefaId,
        mensagem: 'Tarefa cancelada com sucesso',
      });

    } else {
      return NextResponse.json(
        { erro: 'ID da tarefa ou parâmetro limparTodas é obrigatório' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao cancelar tarefa:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}