'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Star,
  FileText,
  Download,
  Filter,
} from 'lucide-react';
import {
  FiltrosPeriodo,
  GraficosDesempenho,
  IndicadoresProdutividade,
  ResumoStatus,
  ExportarRelatorios,
  StatusTempoReal,
} from '@/components/metricas';
import { useMetricasDashboardTempoReal } from '@/hooks/use-metricas-tempo-real';
import { cn } from '@/lib/utils';

/**
 * Interface para filtros específicos de métricas de atendentes
 */
interface FiltrosMetricasAtendentes {
  periodo: string;
  setor?: string;
  cargo?: string;
  status?: string;
  atendenteId?: string;
}

/**
 * Componente da aba de métricas de atendentes
 */
export function MetricasAtendentesTab() {
  const [filtros, setFiltros] = useState<FiltrosMetricasAtendentes>({
    periodo: '30dias',
  });
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Hook para dados em tempo real
  const {
    dados: dadosDashboard,
    carregando,
    status,
    forcarAtualizacao,
    reconectar,
    toggleAtivo,
  } = useMetricasDashboardTempoReal({
    endpoint: '/api/atendentes/dashboard',
    parametros: filtros,
    intervalo: 30000,
  });

  // Função para atualizar filtros
  const handleFiltrosChange = (novosFiltros: any) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  // Função para exportar relatório
  const handleExportar = async (configuracao: any) => {
    setExportando(true);
    try {
      // Implementar lógica de exportação
      console.log('Exportando relatório:', configuracao);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular exportação
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Status e Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Métricas de Atendentes
          </h2>
          <p className="text-muted-foreground">
            Visualize e analise o desempenho dos atendentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusTempoReal
            status={status}
            carregando={carregando}
            onForcarAtualizacao={forcarAtualizacao}
            onReconectar={reconectar}
            onToggleAtivo={toggleAtivo}
            compacto
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className={cn(!mostrarFiltrosAvancados && 'hidden')}>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Período</CardTitle>
          <CardDescription>
            Configure os filtros para personalizar a visualização das métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FiltrosPeriodo
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            mostrarFiltrosAvancados
          />
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      {dadosDashboard?.resumo && (
        <ResumoStatus
          dados={dadosDashboard.resumo}
          periodo={filtros.periodo}
          mostrarTendencias
          mostrarAlertas
        />
      )}

      {/* Grid de Métricas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Indicadores de Produtividade */}
        {dadosDashboard?.produtividade && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Indicadores de Produtividade
              </CardTitle>
              <CardDescription>
                Métricas de performance e eficiência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndicadoresProdutividade
                dados={dadosDashboard.produtividade}
                periodo={filtros.periodo}
                mostrarTendencias
              />
            </CardContent>
          </Card>
        )}

        {/* Gráficos de Desempenho */}
        {dadosDashboard?.graficos && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gráficos de Desempenho
              </CardTitle>
              <CardDescription>
                Visualização gráfica das métricas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GraficosDesempenho
                dados={dadosDashboard.graficos}
                periodo={filtros.periodo}
                tipo="linha"
                altura={300}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Atendimentos por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Atendentes por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDashboard?.atendentesPorStatus && (
              <div className="space-y-3">
                {Object.entries(dadosDashboard.atendentesPorStatus).map(
                  ([status, quantidade]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={status === 'ativo' ? 'default' : 'secondary'}
                        >
                          {status}
                        </Badge>
                      </div>
                      <span className="font-semibold">
                        {quantidade as number}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avaliações Médias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliações Médias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDashboard?.avaliacoes && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {dadosDashboard.avaliacoes.mediaGeral?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Média Geral
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {dadosDashboard.avaliacoes.totalAvaliacoes || 0} avaliações
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentos Criados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Criados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDashboard?.documentos && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {dadosDashboard.documentos.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total no Período
                  </div>
                </div>
                {dadosDashboard.documentos.tendencia && (
                  <div className="text-center">
                    <Badge
                      variant={
                        dadosDashboard.documentos.tendencia > 0
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {dadosDashboard.documentos.tendencia > 0 ? '+' : ''}
                      {dadosDashboard.documentos.tendencia}%
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exportação de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatórios
          </CardTitle>
          <CardDescription>
            Exporte as métricas em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportarRelatorios
            dados={{
              filtros,
              metricas: dadosDashboard,
            }}
            onExportar={handleExportar}
            carregando={exportando}
          />
        </CardContent>
      </Card>
    </div>
  );
}
