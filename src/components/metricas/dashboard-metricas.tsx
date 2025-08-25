'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  TrendingUp,
  Users,
  Settings,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

// Importar componentes de métricas
import {
  GraficosDesempenho,
  IndicadoresProdutividade,
  ResumoStatus,
  FiltrosPeriodo,
  ExportarRelatorios,
  ComparativoAtendentes,
  StatusTempoReal,
} from './index';

// Importar hooks
import {
  useMetricasDashboardTempoReal,
  useMetricasAtendenteTempoReal,
  useMultiplasMetricasTempoReal,
} from '@/hooks/use-metricas-tempo-real';

// Importar tipos
import type {
  DadosMetricas,
  DadosDashboard,
  FiltrosAvancados,
  ConfiguracaoExportacao,
} from './index';

/**
 * Props do dashboard de métricas
 */
export interface DashboardMetricasProps {
  atendenteId?: string; // Se fornecido, mostra métricas individuais
  className?: string;
  tempoRealAtivo?: boolean;
  intervaloAtualizacao?: number;
}

/**
 * Componente principal do dashboard de métricas
 */
export function DashboardMetricas({
  atendenteId,
  className = '',
  tempoRealAtivo = true,
  intervaloAtualizacao = 30000,
}: DashboardMetricasProps) {
  // Estados locais
  const [abaSelecionada, setAbaSelecionada] = useState('resumo');
  const [filtros, setFiltros] = useState<FiltrosAvancados>({});
  const [tempoRealHabilitado, setTempoRealHabilitado] =
    useState(tempoRealAtivo);
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);

  // Hook para métricas em tempo real
  const metricasDashboard = useMetricasDashboardTempoReal(
    tempoRealHabilitado ? filtros : undefined
  );

  const metricasAtendente = useMetricasAtendenteTempoReal(
    atendenteId || '',
    tempoRealHabilitado && atendenteId ? filtros : undefined
  );

  // Determinar qual hook usar baseado no contexto
  const metricas = atendenteId ? metricasAtendente : metricasDashboard;

  // Callbacks para ações
  const handleFiltrosChange = useCallback((novosFiltros: FiltrosAvancados) => {
    setFiltros(novosFiltros);
    toast.info('Filtros aplicados', {
      description: 'Os dados serão atualizados automaticamente',
    });
  }, []);

  const handleToggleTempoReal = useCallback((ativo: boolean) => {
    setTempoRealHabilitado(ativo);
    toast.success(
      ativo
        ? 'Atualização automática ativada'
        : 'Atualização automática pausada'
    );
  }, []);

  const handleExportar = useCallback((config: ConfiguracaoExportacao) => {
    toast.promise(
      new Promise(resolve => {
        // Simular exportação
        setTimeout(() => {
          resolve('Relatório exportado com sucesso!');
        }, 2000);
      }),
      {
        loading: 'Exportando relatório...',
        success: 'Relatório exportado com sucesso!',
        error: 'Erro ao exportar relatório',
      }
    );
  }, []);

  // Dados processados
  const dadosProcessados = useMemo(() => {
    if (!metricas.dados) return null;

    // Adaptar dados conforme necessário
    return metricas.dados;
  }, [metricas.dados]);

  // Renderizar conteúdo baseado na aba selecionada
  const renderizarConteudo = () => {
    if (!dadosProcessados) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      );
    }

    switch (abaSelecionada) {
      case 'resumo':
        return (
          <ResumoStatus
            dados={dadosProcessados}
            carregando={metricas.carregando}
          />
        );

      case 'graficos':
        return (
          <GraficosDesempenho
            dadosIndividuais={atendenteId ? dadosProcessados : undefined}
            dadosDashboard={!atendenteId ? dadosProcessados : undefined}
            carregando={metricas.carregando}
          />
        );

      case 'produtividade':
        return (
          <IndicadoresProdutividade
            dados={dadosProcessados}
            carregando={metricas.carregando}
          />
        );

      case 'comparativo':
        return (
          <ComparativoAtendentes
            dadosIniciais={dadosProcessados}
            carregando={metricas.carregando}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {atendenteId ? 'Métricas do Atendente' : 'Dashboard de Métricas'}
          </h1>
          <p className="text-muted-foreground">
            {atendenteId
              ? 'Acompanhe o desempenho individual em tempo real'
              : 'Visão geral do desempenho da equipe'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status de tempo real */}
          <StatusTempoReal
            status={metricas.status}
            carregando={metricas.carregando}
            ativo={tempoRealHabilitado}
            intervalo={intervaloAtualizacao}
            onForcarAtualizacao={metricas.forcarAtualizacao}
            onReconectar={metricas.reconectar}
            onToggleAtivo={handleToggleTempoReal}
            compacto
          />

          {/* Botão de configurações */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarConfiguracoes(!mostrarConfiguracoes)}
          >
            {mostrarConfiguracoes ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Filtros e configurações */}
      {mostrarConfiguracoes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros e Configurações</CardTitle>
            <CardDescription>
              Configure os filtros e opções de visualização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Filtros */}
              <div>
                <h3 className="font-medium mb-3">Filtros de Período</h3>
                <FiltrosPeriodo
                  filtros={filtros}
                  onChange={handleFiltrosChange}
                  carregando={metricas.carregando}
                />
              </div>

              {/* Exportação */}
              <div>
                <h3 className="font-medium mb-3">Exportar Relatórios</h3>
                <ExportarRelatorios
                  dados={dadosProcessados}
                  onExportar={handleExportar}
                  carregando={metricas.carregando}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas rápidas */}
      {dadosProcessados && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total de Atendentes</p>
                  <p className="text-2xl font-bold">
                    {atendenteId
                      ? '1'
                      : dadosProcessados.totalAtendentes || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Documentos Criados</p>
                  <p className="text-2xl font-bold">
                    {dadosProcessados.totalDocumentos || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Avaliação Média</p>
                  <p className="text-2xl font-bold">
                    {dadosProcessados.avaliacaoMedia?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Última Atualização</p>
                  <p className="text-sm font-medium">
                    {metricas.status.ultimaAtualizacao?.toLocaleTimeString(
                      'pt-BR'
                    ) || 'Nunca'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conteúdo principal */}
      <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumo" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger
            value="produtividade"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Produtividade
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Comparativo
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">{renderizarConteudo()}</div>
      </Tabs>

      {/* Status de conexão detalhado */}
      {!tempoRealHabilitado && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">
                Atualização automática pausada. Os dados podem não estar
                atualizados.
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => handleToggleTempoReal(true)}
                className="text-yellow-800 p-0 h-auto"
              >
                Reativar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardMetricas;
