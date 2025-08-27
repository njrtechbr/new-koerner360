// Tipos para o sistema de lembretes

export type TipoLembrete = 'aviso' | 'urgente' | 'critico' | 'lembrete' | 'vencimento';

export type StatusLembrete = 'pendente' | 'enviado' | 'falhou' | 'cancelado';

export interface ConfiguracaoLembrete {
  diasAntecedencia: number;
  horarioEnvio: string;
  tipoNotificacao: 'email' | 'sistema' | 'ambos';
  template: string;
}

export interface MetadadosLembrete {
  nomeUsuario: string;
  emailUsuario: string;
  tituloAvaliacao: string;
  prazoAvaliacao: string;
}

export interface LembreteBase {
  id: string;
  usuarioId: string;
  avaliacaoId: string;
  tipo: TipoLembrete;
  status: StatusLembrete;
  dataEnvio: string;
  tentativas: number;
  ultimaTentativa: string | null;
  proximaTentativa: string | null;
  configuracao: ConfiguracaoLembrete;
  metadados: MetadadosLembrete;
  criadoEm: string;
  atualizadoEm: string;
}