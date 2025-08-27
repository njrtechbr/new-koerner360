// Exportações das APIs de notificações

// APIs de avaliações
export * from './avaliacoes/route';

// APIs de configuração
export * from './configuracao/route';

// APIs de e-mail
export * from './email/configuracao/route';
export * from './email/envio/route';
export * from './email/agendamento/route';

// Tipos e interfaces comuns
export interface NotificacaoAvaliacao {
  id: string;
  usuarioId: string;
  avaliacaoId: string;
  tipo: 'pendente' | 'vencimento_proximo' | 'vencida';
  urgencia: 'baixa' | 'media' | 'alta';
  titulo: string;
  mensagem: string;
  dataVencimento: Date;
  diasRestantes: number;
  lida: boolean;
  criadaEm: Date;
  atualizadaEm: Date;
}

export interface ConfiguracaoNotificacao {
  id: string;
  usuarioId: string;
  notificacoesAtivas: boolean;
  diasAntecedencia: number;
  horarioNotificacao: string;
  tiposNotificacao: {
    avaliacaoPendente: boolean;
    lembreteVencimento: boolean;
    avaliacaoVencida: boolean;
  };
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ConfiguracaoEmailNotificacao {
  id: string;
  usuarioId: string;
  emailsAtivos: boolean;
  emailPrincipal: string;
  emailsAdicionais: string[];
  frequenciaNotificacao: 'imediata' | 'diaria' | 'semanal';
  tiposNotificacao: {
    avaliacaoPendente: boolean;
    lembreteVencimento: boolean;
    avaliacaoVencida: boolean;
    resumoSemanal: boolean;
  };
  horarioPreferido: string;
  diasAntecedencia: number;
  formatoHtml: boolean;
  incluirResumo: boolean;
  assinaturaPersonalizada?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface EstatisticasNotificacao {
  totalPendentes: number;
  totalVencidas: number;
  totalEnviadas: number;
  totalLidas: number;
  porcentagemLeitura: number;
  ultimaVerificacao: Date;
}

export interface ResultadoEnvioEmail {
  sucesso: boolean;
  sucessos: number;
  falhas: number;
  destinatarios: string[];
  erros: string[];
  estatisticas: {
    tempoEnvio: number;
    tamanhoEmail: number;
    tentativas: number;
  };
}

export interface TarefaAgendada {
  id: string;
  tipo: 'avaliacao_pendente' | 'lembrete_prazo' | 'avaliacao_vencida' | 'resumo_semanal';
  destinatarios: Array<{
    usuarioId: string;
    email: string;
    nome: string;
  }>;
  dadosPersonalizacao: Record<string, any>;
  agendadaPara: Date;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  tentativas: number;
  maxTentativas: number;
  status: 'pendente' | 'executando' | 'concluida' | 'falha' | 'cancelada';
  criadaEm: Date;
  executadaEm?: Date;
  erro?: string;
}

// Utilitários de validação
export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validarHorario = (horario: string): boolean => {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(horario);
};

export const calcularDiasRestantes = (dataVencimento: Date): number => {
  const hoje = new Date();
  const diferenca = dataVencimento.getTime() - hoje.getTime();
  return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
};

export const determinarUrgencia = (diasRestantes: number): 'baixa' | 'media' | 'alta' => {
  if (diasRestantes <= 1) return 'alta';
  if (diasRestantes <= 3) return 'media';
  return 'baixa';
};

// Constantes
export const TIPOS_NOTIFICACAO = {
  AVALIACAO_PENDENTE: 'avaliacao_pendente',
  LEMBRETE_PRAZO: 'lembrete_prazo',
  AVALIACAO_VENCIDA: 'avaliacao_vencida',
  RESUMO_SEMANAL: 'resumo_semanal',
} as const;

export const FREQUENCIAS_EMAIL = {
  IMEDIATA: 'imediata',
  DIARIA: 'diaria',
  SEMANAL: 'semanal',
} as const;

export const PRIORIDADES = {
  BAIXA: 'baixa',
  NORMAL: 'normal',
  ALTA: 'alta',
  URGENTE: 'urgente',
} as const;

export const STATUS_TAREFA = {
  PENDENTE: 'pendente',
  EXECUTANDO: 'executando',
  CONCLUIDA: 'concluida',
  FALHA: 'falha',
  CANCELADA: 'cancelada',
} as const;