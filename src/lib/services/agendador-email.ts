'use client';

import {
  GerenciadorEmailNotificacoes,
  obterGerenciadorEmail,
  TipoNotificacaoEmail,
  DestinatarioEmail
} from '@/lib/utils/email-notificacoes';
import {
  buscarAvaliacoesPendentes,
  buscarAvaliacoesParaNotificacao,
  calcularUrgenciaAvaliacao,
  AvaliacaoPendente
} from '@/lib/utils/notificacoes-avaliacoes';

/**
 * Interface para configuração do agendador
 */
export interface ConfiguracaoAgendador {
  intervaloVerificacao: number; // em minutos
  horarioInicioExpediente: string; // HH:mm
  horarioFimExpediente: string; // HH:mm
  diasUteis: number[]; // 0-6 (domingo-sábado)
  tentativasMaximas: number;
  intervaloTentativas: number; // em minutos
  ativo: boolean;
}

/**
 * Interface para tarefa agendada
 */
export interface TarefaAgendada {
  id: string;
  tipo: TipoNotificacaoEmail;
  avaliacaoId: string;
  usuarioId: string;
  destinatario: DestinatarioEmail;
  dataAgendamento: Date;
  dataExecucao?: Date;
  tentativas: number;
  status: 'pendente' | 'executada' | 'falhada' | 'cancelada';
  erro?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
}

/**
 * Interface para estatísticas do agendador
 */
export interface EstatisticasAgendador {
  tarefasPendentes: number;
  tarefasExecutadas: number;
  tarefasFalhadas: number;
  proximaExecucao?: Date;
  ultimaExecucao?: Date;
  taxaSucesso: number;
}

/**
 * Classe para gerenciar agendamento automático de e-mails
 */
export class AgendadorEmail {
  private configuracao: ConfiguracaoAgendador;
  private tarefas: Map<string, TarefaAgendada> = new Map();
  private intervalos: Map<string, NodeJS.Timeout> = new Map();
  private gerenciadorEmail: GerenciadorEmailNotificacoes;
  private executando = false;

  constructor(configuracao?: Partial<ConfiguracaoAgendador>) {
    this.configuracao = {
      intervaloVerificacao: 30, // 30 minutos
      horarioInicioExpediente: '08:00',
      horarioFimExpediente: '18:00',
      diasUteis: [1, 2, 3, 4, 5], // Segunda a sexta
      tentativasMaximas: 3,
      intervaloTentativas: 5, // 5 minutos
      ativo: true,
      ...configuracao
    };

    this.gerenciadorEmail = obterGerenciadorEmail();
  }

  /**
   * Inicia o agendador
   */
  iniciar(): void {
    if (!this.configuracao.ativo) {
      console.log('Agendador de e-mail está desativado');
      return;
    }

    console.log('Iniciando agendador de e-mail...');
    
    // Verifica imediatamente
    this.verificarEExecutarTarefas();
    
    // Agenda verificações periódicas
    const intervalo = setInterval(() => {
      this.verificarEExecutarTarefas();
    }, this.configuracao.intervaloVerificacao * 60 * 1000);
    
    this.intervalos.set('principal', intervalo);
  }

  /**
   * Para o agendador
   */
  parar(): void {
    console.log('Parando agendador de e-mail...');
    
    for (const [nome, intervalo] of this.intervalos) {
      clearInterval(intervalo);
      this.intervalos.delete(nome);
    }
  }

  /**
   * Agenda uma nova tarefa de e-mail
   */
  agendarTarefa(
    tipo: TipoNotificacaoEmail,
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail,
    dataAgendamento?: Date
  ): string {
    const id = `${tipo}_${avaliacao.id}_${destinatario.id}_${Date.now()}`;
    
    const urgencia = calcularUrgenciaAvaliacao(avaliacao);
    let prioridade: TarefaAgendada['prioridade'] = 'media';
    
    switch (urgencia) {
      case 'critica':
        prioridade = 'critica';
        break;
      case 'alta':
        prioridade = 'alta';
        break;
      case 'media':
        prioridade = 'media';
        break;
      case 'baixa':
        prioridade = 'baixa';
        break;
    }

    const tarefa: TarefaAgendada = {
      id,
      tipo,
      avaliacaoId: avaliacao.id,
      usuarioId: destinatario.id,
      destinatario,
      dataAgendamento: dataAgendamento || new Date(),
      tentativas: 0,
      status: 'pendente',
      prioridade
    };

    this.tarefas.set(id, tarefa);
    console.log(`Tarefa agendada: ${id} para ${dataAgendamento?.toISOString() || 'agora'}`);
    
    return id;
  }

  /**
   * Cancela uma tarefa agendada
   */
  cancelarTarefa(id: string): boolean {
    const tarefa = this.tarefas.get(id);
    if (!tarefa || tarefa.status !== 'pendente') {
      return false;
    }

    tarefa.status = 'cancelada';
    this.tarefas.set(id, tarefa);
    console.log(`Tarefa cancelada: ${id}`);
    
    return true;
  }

  /**
   * Verifica e executa tarefas pendentes
   */
  private async verificarEExecutarTarefas(): Promise<void> {
    if (this.executando) {
      return;
    }

    this.executando = true;
    
    try {
      const agora = new Date();
      const tarefasPendentes = Array.from(this.tarefas.values())
        .filter(tarefa => 
          tarefa.status === 'pendente' && 
          tarefa.dataAgendamento <= agora
        )
        .sort((a, b) => {
          // Ordena por prioridade e depois por data
          const prioridadeOrder = { critica: 4, alta: 3, media: 2, baixa: 1 };
          const diffPrioridade = prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
          
          if (diffPrioridade !== 0) {
            return diffPrioridade;
          }
          
          return a.dataAgendamento.getTime() - b.dataAgendamento.getTime();
        });

      console.log(`Verificando ${tarefasPendentes.length} tarefas pendentes`);

      for (const tarefa of tarefasPendentes) {
        if (this.deveExecutarAgora(tarefa)) {
          await this.executarTarefa(tarefa);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar tarefas:', error);
    } finally {
      this.executando = false;
    }
  }

  /**
   * Verifica se uma tarefa deve ser executada agora
   */
  private deveExecutarAgora(tarefa: TarefaAgendada): boolean {
    const agora = new Date();
    
    // Verifica se está no horário de expediente
    if (!this.estaNoHorarioExpediente(agora)) {
      // Tarefas críticas podem ser executadas fora do expediente
      if (tarefa.prioridade !== 'critica') {
        return false;
      }
    }

    // Verifica se é dia útil
    if (!this.configuracao.diasUteis.includes(agora.getDay())) {
      // Tarefas críticas podem ser executadas em fins de semana
      if (tarefa.prioridade !== 'critica') {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifica se está no horário de expediente
   */
  private estaNoHorarioExpediente(data: Date): boolean {
    const hora = data.getHours();
    const minuto = data.getMinutes();
    const horaAtual = hora * 60 + minuto;

    const [horaInicio, minutoInicio] = this.configuracao.horarioInicioExpediente
      .split(':')
      .map(Number);
    const [horaFim, minutoFim] = this.configuracao.horarioFimExpediente
      .split(':')
      .map(Number);

    const inicioExpediente = horaInicio * 60 + minutoInicio;
    const fimExpediente = horaFim * 60 + minutoFim;

    return horaAtual >= inicioExpediente && horaAtual <= fimExpediente;
  }

  /**
   * Executa uma tarefa específica
   */
  private async executarTarefa(tarefa: TarefaAgendada): Promise<void> {
    console.log(`Executando tarefa: ${tarefa.id}`);
    
    try {
      tarefa.tentativas++;
      tarefa.dataExecucao = new Date();

      // Busca dados atualizados da avaliação
      const avaliacoesPendentes = await buscarAvaliacoesPendentes(tarefa.usuarioId);
      const avaliacao = avaliacoesPendentes.find(a => a.id === tarefa.avaliacaoId);

      if (!avaliacao) {
        tarefa.status = 'cancelada';
        tarefa.erro = 'Avaliação não encontrada ou já foi concluída';
        this.tarefas.set(tarefa.id, tarefa);
        return;
      }

      let resultado;
      
      switch (tarefa.tipo) {
        case 'avaliacao_pendente':
          resultado = await this.gerenciadorEmail.enviarNotificacaoAvaliacaoPendente(
            avaliacao,
            tarefa.destinatario
          );
          break;
          
        case 'lembrete_prazo':
          const diasRestantes = Math.ceil(
            (avaliacao.prazo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          resultado = await this.gerenciadorEmail.enviarLembretePrazo(
            avaliacao,
            tarefa.destinatario,
            diasRestantes
          );
          break;
          
        case 'avaliacao_vencida':
          resultado = await this.gerenciadorEmail.enviarNotificacaoVencida(
            avaliacao,
            tarefa.destinatario
          );
          break;
          
        case 'resumo_semanal':
          const todasAvaliacoes = await buscarAvaliacoesPendentes(tarefa.usuarioId);
          resultado = await this.gerenciadorEmail.enviarResumoSemanal(
            todasAvaliacoes,
            tarefa.destinatario
          );
          break;
          
        default:
          throw new Error(`Tipo de tarefa não suportado: ${tarefa.tipo}`);
      }

      if (resultado.sucesso) {
        tarefa.status = 'executada';
        console.log(`Tarefa executada com sucesso: ${tarefa.id}`);
      } else {
        throw new Error(resultado.erro || 'Erro desconhecido');
      }
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`Erro ao executar tarefa ${tarefa.id}:`, mensagemErro);
      
      tarefa.erro = mensagemErro;
      
      if (tarefa.tentativas >= this.configuracao.tentativasMaximas) {
        tarefa.status = 'falhada';
        console.log(`Tarefa falhada após ${tarefa.tentativas} tentativas: ${tarefa.id}`);
      } else {
        // Reagenda para nova tentativa
        const proximaTentativa = new Date(
          Date.now() + this.configuracao.intervaloTentativas * 60 * 1000
        );
        tarefa.dataAgendamento = proximaTentativa;
        console.log(`Reagendando tarefa ${tarefa.id} para ${proximaTentativa.toISOString()}`);
      }
    }

    this.tarefas.set(tarefa.id, tarefa);
  }

  /**
   * Agenda notificações automáticas para avaliações pendentes
   */
  async agendarNotificacoesAutomaticas(): Promise<void> {
    try {
      console.log('Agendando notificações automáticas...');
      
      // Busca todas as avaliações que precisam de notificação
      const avaliacoesParaNotificacao = await buscarAvaliacoesParaNotificacao(3); // 3 dias de antecedência
      
      for (const avaliacao of avaliacoesParaNotificacao) {
        const destinatario: DestinatarioEmail = {
          id: avaliacao.usuarioId,
          nome: avaliacao.nomeUsuario,
          email: avaliacao.emailUsuario
        };

        const urgencia = calcularUrgenciaAvaliacao(avaliacao);
        const agora = new Date();
        
        // Determina o tipo de notificação baseado na urgência
        if (avaliacao.prazo < agora) {
          // Avaliação vencida
          this.agendarTarefa('avaliacao_vencida', avaliacao, destinatario);
        } else {
          const diasRestantes = Math.ceil(
            (avaliacao.prazo.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diasRestantes <= 1) {
            // Lembrete urgente
            this.agendarTarefa('lembrete_prazo', avaliacao, destinatario);
          } else if (diasRestantes <= 3) {
            // Lembrete normal
            const dataAgendamento = new Date(agora.getTime() + 60 * 60 * 1000); // 1 hora
            this.agendarTarefa('lembrete_prazo', avaliacao, destinatario, dataAgendamento);
          } else {
            // Notificação de avaliação pendente
            const dataAgendamento = new Date(agora.getTime() + 2 * 60 * 60 * 1000); // 2 horas
            this.agendarTarefa('avaliacao_pendente', avaliacao, destinatario, dataAgendamento);
          }
        }
      }
      
      console.log(`${avaliacoesParaNotificacao.length} notificações agendadas`);
    } catch (error) {
      console.error('Erro ao agendar notificações automáticas:', error);
    }
  }

  /**
   * Agenda resumos semanais
   */
  agendarResumosSemanas(): void {
    // Agenda para toda segunda-feira às 9h
    const agora = new Date();
    const proximaSegunda = new Date(agora);
    
    // Calcula próxima segunda-feira
    const diasAteSegunda = (1 + 7 - agora.getDay()) % 7;
    proximaSegunda.setDate(agora.getDate() + (diasAteSegunda || 7));
    proximaSegunda.setHours(9, 0, 0, 0);

    const intervalo = setInterval(async () => {
      try {
        console.log('Agendando resumos semanais...');
        
        // Aqui você implementaria a lógica para buscar todos os usuários
        // e agendar resumos semanais para cada um
        
        // Exemplo simplificado:
        // const usuarios = await buscarTodosUsuarios();
        // for (const usuario of usuarios) {
        //   const avaliacoes = await buscarAvaliacoesPendentes(usuario.id);
        //   if (avaliacoes.length > 0) {
        //     this.agendarTarefa('resumo_semanal', avaliacoes[0], usuario);
        //   }
        // }
        
      } catch (error) {
        console.error('Erro ao agendar resumos semanais:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // A cada 7 dias

    this.intervalos.set('resumo_semanal', intervalo);
  }

  /**
   * Obtém estatísticas do agendador
   */
  obterEstatisticas(): EstatisticasAgendador {
    const tarefas = Array.from(this.tarefas.values());
    
    const tarefasPendentes = tarefas.filter(t => t.status === 'pendente').length;
    const tarefasExecutadas = tarefas.filter(t => t.status === 'executada').length;
    const tarefasFalhadas = tarefas.filter(t => t.status === 'falhada').length;
    
    const proximaExecucao = tarefas
      .filter(t => t.status === 'pendente')
      .sort((a, b) => a.dataAgendamento.getTime() - b.dataAgendamento.getTime())[0]?.dataAgendamento;
    
    const ultimaExecucao = tarefas
      .filter(t => t.dataExecucao)
      .sort((a, b) => (b.dataExecucao?.getTime() || 0) - (a.dataExecucao?.getTime() || 0))[0]?.dataExecucao;
    
    const totalTarefas = tarefasExecutadas + tarefasFalhadas;
    const taxaSucesso = totalTarefas > 0 ? (tarefasExecutadas / totalTarefas) * 100 : 0;

    return {
      tarefasPendentes,
      tarefasExecutadas,
      tarefasFalhadas,
      proximaExecucao,
      ultimaExecucao,
      taxaSucesso
    };
  }

  /**
   * Limpa tarefas antigas
   */
  limparTarefasAntigas(diasAntigos = 30): void {
    const dataLimite = new Date(Date.now() - diasAntigos * 24 * 60 * 60 * 1000);
    
    for (const [id, tarefa] of this.tarefas) {
      if (
        (tarefa.status === 'executada' || tarefa.status === 'falhada' || tarefa.status === 'cancelada') &&
        tarefa.dataAgendamento < dataLimite
      ) {
        this.tarefas.delete(id);
      }
    }
    
    console.log('Tarefas antigas removidas');
  }

  /**
   * Atualiza configuração do agendador
   */
  atualizarConfiguracao(novaConfiguracao: Partial<ConfiguracaoAgendador>): void {
    this.configuracao = {
      ...this.configuracao,
      ...novaConfiguracao
    };
    
    console.log('Configuração do agendador atualizada');
  }

  /**
   * Obtém configuração atual
   */
  obterConfiguracao(): ConfiguracaoAgendador {
    return { ...this.configuracao };
  }

  /**
   * Obtém todas as tarefas
   */
  obterTarefas(): TarefaAgendada[] {
    return Array.from(this.tarefas.values());
  }

  /**
   * Obtém tarefa por ID
   */
  obterTarefa(id: string): TarefaAgendada | undefined {
    return this.tarefas.get(id);
  }
}

// Instância singleton do agendador
let instanciaAgendador: AgendadorEmail | null = null;

/**
 * Obtém instância singleton do agendador de e-mail
 */
export function obterAgendadorEmail(configuracao?: Partial<ConfiguracaoAgendador>): AgendadorEmail {
  if (!instanciaAgendador) {
    instanciaAgendador = new AgendadorEmail(configuracao);
  }
  return instanciaAgendador;
}

/**
 * Utilitários para agendamento rápido
 */
export const agendadorUtils = {
  /**
   * Inicia agendador com configuração padrão
   */
  iniciarAgendador: (configuracao?: Partial<ConfiguracaoAgendador>) => {
    const agendador = obterAgendadorEmail(configuracao);
    agendador.iniciar();
    agendador.agendarResumosSemanas();
    return agendador;
  },

  /**
   * Para agendador
   */
  pararAgendador: () => {
    if (instanciaAgendador) {
      instanciaAgendador.parar();
    }
  },

  /**
   * Agenda notificação imediata
   */
  agendarNotificacaoImediata: (
    tipo: TipoNotificacaoEmail,
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ) => {
    const agendador = obterAgendadorEmail();
    return agendador.agendarTarefa(tipo, avaliacao, destinatario, new Date());
  },

  /**
   * Agenda lembrete com antecedência
   */
  agendarLembreteComAntecedencia: (
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail,
    horasAntecedencia: number
  ) => {
    const agendador = obterAgendadorEmail();
    const dataAgendamento = new Date(Date.now() + horasAntecedencia * 60 * 60 * 1000);
    return agendador.agendarTarefa('lembrete_prazo', avaliacao, destinatario, dataAgendamento);
  }
};