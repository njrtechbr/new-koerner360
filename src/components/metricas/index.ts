/**
 * Exportações dos componentes de métricas e dashboard
 */

export { GraficosDesempenho } from './graficos-desempenho';
export { IndicadoresProdutividade } from './indicadores-produtividade';
export { ResumoStatus } from './resumo-status';
export {
  FiltrosPeriodo,
  type FiltrosPeriodo as TipoFiltrosPeriodo,
} from './filtros-periodo';
export { ExportarRelatorios } from './exportar-relatorios';
export { ComparativoAtendentes } from './comparativo-atendentes';
export { StatusTempoReal, IndicadorStatusSimples } from './status-tempo-real';
export { DashboardMetricas } from './dashboard-metricas';

// Exportações padrão
export { default as GraficosDesempenhoDefault } from './graficos-desempenho';
export { default as IndicadoresProdutividadeDefault } from './indicadores-produtividade';
export { default as ResumoStatusDefault } from './resumo-status';
export { default as FiltrosPeriodoDefault } from './filtros-periodo';
export { default as ExportarRelatoriosDefault } from './exportar-relatorios';
export { default as ComparativoAtendentesDefault } from './comparativo-atendentes';
export { default as StatusTempoRealDefault } from './status-tempo-real';
export { default as DashboardMetricasDefault } from './dashboard-metricas';

// Exportações de tipos
export type { DadosMetricas, DadosDashboard } from './graficos-desempenho';
export type {
  Indicador,
  DadosProdutividade,
} from './indicadores-produtividade';
export type { DadosResumo, ResumoStatusProps } from './resumo-status';
export type { FiltrosPeriodoProps, FiltrosAvancados } from './filtros-periodo';
export type {
  ConfiguracaoExportacao,
  TipoExportacao,
  DadosExportacao,
} from './exportar-relatorios';
export type {
  DadosAtendente,
  ConfiguracaoComparacao,
} from './comparativo-atendentes';
export type { StatusTempoRealProps } from './status-tempo-real';
export type { DashboardMetricasProps } from './dashboard-metricas';
