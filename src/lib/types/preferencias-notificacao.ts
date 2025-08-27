export interface PreferenciasNotificacao {
  id: string;
  usuarioId: string;
  
  // Configurações gerais
  notificacoesAtivas: boolean;
  emailAtivo: boolean;
  
  // Configurações de timing
  diasAntecedenciaLembrete: number; // dias antes do prazo
  horarioEnvio: string; // formato HH:mm
  incluirFinsDeSemanaSemana: boolean;
  incluirFeriados: boolean;
  
  // Tipos de notificação
  tiposNotificacao: {
    avaliacaoPendente: boolean;
    avaliacaoVencida: boolean;
    avaliacaoProximaVencimento: boolean;
    novaAvaliacaoRecebida: boolean;
    avaliacaoCompletada: boolean;
    lembretePersonalizado: boolean;
  };
  
  // Configurações de urgência
  urgenciaMinima: 'BAIXA' | 'MEDIA' | 'ALTA';
  
  // Configurações de frequência
  frequenciaLembretes: {
    avaliacaoPendente: 'DIARIO' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'NUNCA';
    avaliacaoVencida: 'DIARIO' | 'SEMANAL' | 'NUNCA';
  };
  
  // Configurações de conteúdo
  incluirDetalhesAvaliacao: boolean;
  incluirLinkDireto: boolean;
  incluirResumoEstatisticas: boolean;
  
  // Configurações de formato
  formatoEmail: 'TEXTO' | 'HTML';
  idiomaNotificacao: 'PT_BR' | 'EN' | 'ES';
  
  // Configurações avançadas
  pausarNotificacoes: {
    ativo: boolean;
    dataInicio?: Date;
    dataFim?: Date;
    motivo?: string;
  };
  
  // Configurações de filtro
  filtros: {
    apenasMinhasAvaliacoes: boolean;
    apenasAvaliacoesQueEuAvalio: boolean;
    departamentosEspecificos: string[];
    cargosEspecificos: string[];
  };
  
  // Metadados
  criadoEm: Date;
  atualizadoEm: Date;
  ultimaNotificacaoEnviada?: Date;
  versao: number;
}

export interface PreferenciasNotificacaoInput {
  notificacoesAtivas?: boolean;
  emailAtivo?: boolean;
  diasAntecedenciaLembrete?: number;
  horarioEnvio?: string;
  incluirFinsDeSemanaSemana?: boolean;
  incluirFeriados?: boolean;
  tiposNotificacao?: Partial<PreferenciasNotificacao['tiposNotificacao']>;
  urgenciaMinima?: PreferenciasNotificacao['urgenciaMinima'];
  frequenciaLembretes?: Partial<PreferenciasNotificacao['frequenciaLembretes']>;
  incluirDetalhesAvaliacao?: boolean;
  incluirLinkDireto?: boolean;
  incluirResumoEstatisticas?: boolean;
  formatoEmail?: PreferenciasNotificacao['formatoEmail'];
  idiomaNotificacao?: PreferenciasNotificacao['idiomaNotificacao'];
  pausarNotificacoes?: Partial<PreferenciasNotificacao['pausarNotificacoes']>;
  filtros?: Partial<PreferenciasNotificacao['filtros']>;
}

export interface PreferenciasNotificacaoDefaults {
  notificacoesAtivas: boolean;
  emailAtivo: boolean;
  diasAntecedenciaLembrete: number;
  horarioEnvio: string;
  incluirFinsDeSemanaSemana: boolean;
  incluirFeriados: boolean;
  tiposNotificacao: PreferenciasNotificacao['tiposNotificacao'];
  urgenciaMinima: PreferenciasNotificacao['urgenciaMinima'];
  frequenciaLembretes: PreferenciasNotificacao['frequenciaLembretes'];
  incluirDetalhesAvaliacao: boolean;
  incluirLinkDireto: boolean;
  incluirResumoEstatisticas: boolean;
  formatoEmail: PreferenciasNotificacao['formatoEmail'];
  idiomaNotificacao: PreferenciasNotificacao['idiomaNotificacao'];
  filtros: PreferenciasNotificacao['filtros'];
}

export const PREFERENCIAS_DEFAULTS: PreferenciasNotificacaoDefaults = {
  notificacoesAtivas: true,
  emailAtivo: true,
  diasAntecedenciaLembrete: 3,
  horarioEnvio: '09:00',
  incluirFinsDeSemanaSemana: false,
  incluirFeriados: false,
  tiposNotificacao: {
    avaliacaoPendente: true,
    avaliacaoVencida: true,
    avaliacaoProximaVencimento: true,
    novaAvaliacaoRecebida: true,
    avaliacaoCompletada: false,
    lembretePersonalizado: true,
  },
  urgenciaMinima: 'BAIXA',
  frequenciaLembretes: {
    avaliacaoPendente: 'SEMANAL',
    avaliacaoVencida: 'DIARIO',
  },
  incluirDetalhesAvaliacao: true,
  incluirLinkDireto: true,
  incluirResumoEstatisticas: false,
  formatoEmail: 'HTML',
  idiomaNotificacao: 'PT_BR',
  filtros: {
    apenasMinhasAvaliacoes: false,
    apenasAvaliacoesQueEuAvalio: false,
    departamentosEspecificos: [],
    cargosEspecificos: [],
  },
};