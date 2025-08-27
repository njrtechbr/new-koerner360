import { prisma } from '@/lib/prisma';
import { AgendadorEmail } from './agendador-email';
import { obterGerenciadorEmail } from '@/lib/utils/email-notificacoes';
import { addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface ConfiguracaoLembrete {
  diasAntecedencia: number[];
  horarioEnvio: string; // HH:mm
  ativo: boolean;
  incluirFimDeSemana: boolean;
  incluirFeriados: boolean;
}

interface LembreteAgendado {
  id: string;
  avaliacaoId: string;
  usuarioId: string;
  tipo: 'lembrete' | 'vencimento';
  dataEnvio: Date;
  enviado: boolean;
  tentativas: number;
  ultimaTentativa?: Date;
  erro?: string;
}

interface EstatisticasLembretes {
  totalAgendados: number;
  totalEnviados: number;
  totalPendentes: number;
  totalFalhas: number;
  proximosEnvios: LembreteAgendado[];
  ultimosEnviados: LembreteAgendado[];
}

class AgendadorLembretes {
  private agendadorEmail: AgendadorEmail;
  private gerenciadorEmail = obterGerenciadorEmail();
  private intervalos: Map<string, NodeJS.Timeout> = new Map();
  private ativo = false;
  private configuracao: ConfiguracaoLembrete = {
    diasAntecedencia: [7, 3, 1], // 7, 3 e 1 dia antes do vencimento
    horarioEnvio: '09:00',
    ativo: true,
    incluirFimDeSemana: false,
    incluirFeriados: false,
  };

  constructor() {
    this.agendadorEmail = new AgendadorEmail();
  }

  /**
   * Inicia o agendador de lembretes
   */
  async iniciar(): Promise<void> {
    if (this.ativo) {
      console.log('Agendador de lembretes já está ativo');
      return;
    }

    this.ativo = true;
    console.log('Iniciando agendador de lembretes...');

    // Agendar verificação a cada hora
    const intervalo = setInterval(() => {
      this.verificarLembretesPendentes().catch(console.error);
    }, 60 * 60 * 1000); // 1 hora

    this.intervalos.set('verificacao-principal', intervalo);

    // Executar verificação inicial
    await this.verificarLembretesPendentes();

    console.log('Agendador de lembretes iniciado com sucesso');
  }

  /**
   * Para o agendador de lembretes
   */
  parar(): void {
    if (!this.ativo) {
      console.log('Agendador de lembretes já está parado');
      return;
    }

    this.ativo = false;
    
    // Limpar todos os intervalos
    this.intervalos.forEach((intervalo) => {
      clearInterval(intervalo);
    });
    this.intervalos.clear();

    console.log('Agendador de lembretes parado');
  }

  /**
   * Atualiza a configuração do agendador
   */
  async atualizarConfiguracao(novaConfiguracao: Partial<ConfiguracaoLembrete>): Promise<void> {
    this.configuracao = { ...this.configuracao, ...novaConfiguracao };
    
    // Reagendar lembretes se necessário
    if (this.ativo) {
      await this.reagendarTodosLembretes();
    }

    console.log('Configuração do agendador atualizada:', this.configuracao);
  }

  /**
   * Verifica e processa lembretes pendentes
   */
  private async verificarLembretesPendentes(): Promise<void> {
    if (!this.configuracao.ativo) {
      return;
    }

    try {
      console.log('Verificando lembretes pendentes...');

      // Buscar avaliações que precisam de lembretes
      const avaliacoesPendentes = await this.buscarAvaliacoesPendentes();
      
      for (const avaliacao of avaliacoesPendentes) {
        await this.processarLembretesAvaliacao(avaliacao);
      }

      // Enviar lembretes agendados para agora
      await this.enviarLembretesAgendados();

    } catch (error) {
      console.error('Erro ao verificar lembretes pendentes:', error);
    }
  }

  /**
   * Busca avaliações que precisam de lembretes
   */
  private async buscarAvaliacoesPendentes() {
    const agora = new Date();
    const em30Dias = addDays(agora, 30); // Buscar avaliações com prazo nos próximos 30 dias

    return await prisma.avaliacao.findMany({
      where: {
        status: 'PENDENTE',
        prazo: {
          gte: agora,
          lte: em30Dias,
        },
      },
      include: {
        avaliado: true,
        avaliador: true,
        periodo: true,
      },
    });
  }

  /**
   * Processa lembretes para uma avaliação específica
   */
  private async processarLembretesAvaliacao(avaliacao: any): Promise<void> {
    const agora = new Date();
    const prazoAvaliacao = new Date(avaliacao.prazo);

    // Verificar se já passou do prazo
    if (isBefore(prazoAvaliacao, agora)) {
      await this.agendarLembreteVencimento(avaliacao);
      return;
    }

    // Agendar lembretes de antecedência
    for (const dias of this.configuracao.diasAntecedencia) {
      const dataLembrete = addDays(prazoAvaliacao, -dias);
      
      if (isAfter(dataLembrete, agora)) {
        await this.agendarLembrete(avaliacao, dataLembrete, 'lembrete');
      }
    }
  }

  /**
   * Agenda um lembrete específico
   */
  private async agendarLembrete(
    avaliacao: any,
    dataEnvio: Date,
    tipo: 'lembrete' | 'vencimento'
  ): Promise<void> {
    // Verificar se já existe um lembrete agendado
    const lembreteExistente = await this.buscarLembreteExistente(
      avaliacao.id,
      avaliacao.avaliadorId,
      tipo,
      dataEnvio
    );

    if (lembreteExistente) {
      return; // Já existe
    }

    // Ajustar horário de envio
    const dataEnvioComHorario = this.ajustarHorarioEnvio(dataEnvio);

    // Verificar se é dia útil (se configurado)
    if (!this.configuracao.incluirFimDeSemana && this.isFimDeSemana(dataEnvioComHorario)) {
      return; // Pular fim de semana
    }

    // Criar registro do lembrete
    await this.criarRegistroLembrete({
      avaliacaoId: avaliacao.id,
      usuarioId: avaliacao.avaliadorId,
      tipo,
      dataEnvio: dataEnvioComHorario,
      enviado: false,
      tentativas: 0,
    });

    console.log(`Lembrete ${tipo} agendado para ${dataEnvioComHorario.toISOString()}`);
  }

  /**
   * Agenda lembrete de vencimento
   */
  private async agendarLembreteVencimento(avaliacao: any): Promise<void> {
    const agora = new Date();
    await this.agendarLembrete(avaliacao, agora, 'vencimento');
  }

  /**
   * Envia lembretes que estão agendados para agora
   */
  private async enviarLembretesAgendados(): Promise<void> {
    const agora = new Date();
    const inicioHora = startOfDay(agora);
    const fimHora = endOfDay(agora);

    // Buscar lembretes agendados para hoje
    const lembretesParaEnviar = await this.buscarLembretesParaEnvio(inicioHora, fimHora);

    for (const lembrete of lembretesParaEnviar) {
      await this.enviarLembrete(lembrete);
    }
  }

  /**
   * Envia um lembrete específico
   */
  private async enviarLembrete(lembrete: any): Promise<void> {
    try {
      console.log(`Enviando lembrete ${lembrete.tipo} para usuário ${lembrete.usuarioId}`);

      // Buscar dados da avaliação
      const avaliacao = await prisma.avaliacao.findUnique({
        where: { id: lembrete.avaliacaoId },
        include: {
          avaliado: true,
          avaliador: true,
          periodo: true,
        },
      });

      if (!avaliacao) {
        throw new Error('Avaliação não encontrada');
      }

      // Enviar e-mail
      const resultado = await this.gerenciadorEmail.enviarEmailAvaliacaoPendente(
        avaliacao.avaliador.email,
        {
          nomeAvaliador: avaliacao.avaliador.nome,
          nomeAvaliado: avaliacao.avaliado.nome,
          cargoAvaliado: avaliacao.avaliado.cargo || 'Não informado',
          prazo: avaliacao.prazo,
          linkAvaliacao: `/avaliacoes/${avaliacao.id}`,
          periodo: avaliacao.periodo.nome,
        }
      );

      // Atualizar registro do lembrete
      await this.atualizarRegistroLembrete(lembrete.id, {
        enviado: resultado.sucesso,
        tentativas: lembrete.tentativas + 1,
        ultimaTentativa: new Date(),
        erro: resultado.sucesso ? undefined : resultado.erro,
      });

      // Criar notificação no sistema
      await this.criarNotificacaoLembrete(avaliacao, lembrete.tipo);

      console.log(`Lembrete ${lembrete.tipo} enviado com sucesso`);

    } catch (error) {
      console.error(`Erro ao enviar lembrete ${lembrete.id}:`, error);
      
      // Atualizar registro com erro
      await this.atualizarRegistroLembrete(lembrete.id, {
        tentativas: lembrete.tentativas + 1,
        ultimaTentativa: new Date(),
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * Cria notificação no sistema para o lembrete
   */
  private async criarNotificacaoLembrete(avaliacao: any, tipo: 'lembrete' | 'vencimento'): Promise<void> {
    const titulo = tipo === 'lembrete' 
      ? 'Lembrete: Avaliação Pendente'
      : 'Avaliação Vencida';
    
    const descricao = tipo === 'lembrete'
      ? `Você tem uma avaliação pendente de ${avaliacao.avaliado.nome}`
      : `A avaliação de ${avaliacao.avaliado.nome} está vencida`;

    await prisma.notificacao.create({
      data: {
        titulo,
        descricao,
        tipo: tipo === 'lembrete' ? 'lembrete' : 'vencida',
        urgencia: tipo === 'lembrete' ? 'media' : 'alta',
        usuarioId: avaliacao.avaliadorId,
        avaliacaoId: avaliacao.id,
        lida: false,
        prazo: avaliacao.prazo,
      },
    });
  }

  /**
   * Reagenda todos os lembretes
   */
  private async reagendarTodosLembretes(): Promise<void> {
    console.log('Reagendando todos os lembretes...');
    
    // Limpar lembretes não enviados
    await this.limparLembretesNaoEnviados();
    
    // Reprocessar avaliações pendentes
    await this.verificarLembretesPendentes();
  }

  /**
   * Utilitários
   */
  private ajustarHorarioEnvio(data: Date): Date {
    const [horas, minutos] = this.configuracao.horarioEnvio.split(':').map(Number);
    const novaData = new Date(data);
    novaData.setHours(horas, minutos, 0, 0);
    return novaData;
  }

  private isFimDeSemana(data: Date): boolean {
    const diaSemana = data.getDay();
    return diaSemana === 0 || diaSemana === 6; // Domingo ou Sábado
  }

  /**
   * Métodos de banco de dados
   */
  private async buscarLembreteExistente(
    avaliacaoId: string,
    usuarioId: string,
    tipo: string,
    dataEnvio: Date
  ) {
    // Implementar busca no banco de dados
    // Por enquanto, retorna null (assumindo que não existe)
    return null;
  }

  private async criarRegistroLembrete(dados: Omit<LembreteAgendado, 'id'>): Promise<void> {
    // Implementar criação no banco de dados
    console.log('Criando registro de lembrete:', dados);
  }

  private async atualizarRegistroLembrete(id: string, dados: Partial<LembreteAgendado>): Promise<void> {
    // Implementar atualização no banco de dados
    console.log('Atualizando registro de lembrete:', id, dados);
  }

  private async buscarLembretesParaEnvio(inicio: Date, fim: Date): Promise<any[]> {
    // Implementar busca no banco de dados
    // Por enquanto, retorna array vazio
    return [];
  }

  private async limparLembretesNaoEnviados(): Promise<void> {
    // Implementar limpeza no banco de dados
    console.log('Limpando lembretes não enviados');
  }

  /**
   * Métodos públicos para estatísticas e controle
   */
  async obterEstatisticas(): Promise<EstatisticasLembretes> {
    // Implementar busca de estatísticas
    return {
      totalAgendados: 0,
      totalEnviados: 0,
      totalPendentes: 0,
      totalFalhas: 0,
      proximosEnvios: [],
      ultimosEnviados: [],
    };
  }

  obterConfiguracao(): ConfiguracaoLembrete {
    return { ...this.configuracao };
  }

  estaAtivo(): boolean {
    return this.ativo;
  }

  async forcarVerificacao(): Promise<void> {
    await this.verificarLembretesPendentes();
  }

  async reagendarAvaliacao(avaliacaoId: string): Promise<void> {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: {
        avaliado: true,
        avaliador: true,
        periodo: true,
      },
    });

    if (avaliacao) {
      await this.processarLembretesAvaliacao(avaliacao);
    }
  }
}

// Instância singleton
let instanciaAgendador: AgendadorLembretes | null = null;

/**
 * Obtém a instância singleton do agendador de lembretes
 */
export function obterAgendadorLembretes(): AgendadorLembretes {
  if (!instanciaAgendador) {
    instanciaAgendador = new AgendadorLembretes();
  }
  return instanciaAgendador;
}

/**
 * Utilitários para agendamento de lembretes
 */
export const lembretesUtils = {
  /**
   * Inicia o agendador automaticamente
   */
  async iniciarAutomatico(): Promise<void> {
    const agendador = obterAgendadorLembretes();
    await agendador.iniciar();
  },

  /**
   * Para o agendador
   */
  pararAgendador(): void {
    const agendador = obterAgendadorLembretes();
    agendador.parar();
  },

  /**
   * Força verificação de lembretes
   */
  async forcarVerificacao(): Promise<void> {
    const agendador = obterAgendadorLembretes();
    await agendador.forcarVerificacao();
  },

  /**
   * Reagenda lembretes para uma avaliação específica
   */
  async reagendarAvaliacao(avaliacaoId: string): Promise<void> {
    const agendador = obterAgendadorLembretes();
    await agendador.reagendarAvaliacao(avaliacaoId);
  },
};

export type {
  ConfiguracaoLembrete,
  LembreteAgendado,
  EstatisticasLembretes,
};

export { AgendadorLembretes };