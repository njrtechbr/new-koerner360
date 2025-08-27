export { useNotificacoesAvaliacoes } from './use-notificacoes-avaliacoes';
export { useEmailNotificacoes } from './use-email-notificacoes';
export { useLembretes, useAgendadorLembretes } from './use-lembretes';
export { usePreferenciasNotificacao } from './use-preferencias-notificacao';

// Tipos relacionados a lembretes
export type {
  Lembrete,
  ConfiguracaoAgendador,
  StatusAgendador,
  FiltrosLembretes,
  PaginacaoLembretes,
  ResultadoLembretes,
} from './use-lembretes';

// Tipos relacionados a preferências
export type {
  PreferenciasNotificacao,
  PreferenciasNotificacaoInput,
  PreferenciasNotificacaoDefaults,
} from '../lib/types/preferencias-notificacao';