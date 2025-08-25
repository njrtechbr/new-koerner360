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
  AlertTriangle,
  CheckCircle,
  Activity,
  Target,
  Zap,
  Award,
} from 'lucide-react';
import {
  DashboardMetricas,
  StatusTempoReal,
  FiltrosPeriodo,
} from '@/components/metricas';
import { useMetricasDashboardTempoReal } from '@/hooks/use-metricas-tempo-real';
import { cn } from '@/lib/utils';

/**
 * Interface para dados do dashboard
 */
interface DadosDashboard {
  resumo: {
    totalAtendentes: number;
    atendentesPorStatus: Record<string, number>;
    atendentesPorSetor: Record<string, number>;
    atendentesPorCargo: Record<string, number>;
    documentosCriados: number;
    avaliacoes: {
      total: number;
      mediaGeral: number;
    };
    alteracoes: number;
    desempenho: {
      excelente: number;
      bom: number;
      regular: number;
      ruim: number;
    };
    alertas: Array<{
      tipo: 'warning' | 'error' | 'info';
      mensagem: string;
    }>;
  };
  tendencias: Record<string, number>;
  topPerformers: Array<{
    id: string;
    nome: string;
    cargo: string;
    setor: string;
    pontuacao: number;
    avaliacaoMedia: number;
  }>;
  metricas: {
    produtividade: number;
    qualidade: number;
    pontualidade: number;
    satisfacao: number;
  };
}

/**
 * Componente da aba de dashboard de atendentes
 */
export function DashboardAtendentesTab() {
  const [filtros, setFiltros] = useState({
    periodo: '30dias',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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

  // Função para obter cor do indicador baseado no valor
  const obterCorIndicador = (
    valor: number,
    tipo: 'percentual' | 'nota' = 'percentual'
  ) => {
    if (tipo === 'nota') {
      if (valor >= 4.5) return 'text-green-600';
      if (valor >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    }

    if (valor >= 80) return 'text-green-600';
    if (valor >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Dashboard de Atendentes
          </h2>
          <p className="text-muted-foreground">
            Visão geral em tempo real do desempenho dos atendentes
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
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            Filtros
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltrosPeriodo
              filtros={filtros}
              onFiltrosChange={handleFiltrosChange}
              compacto
            />
          </CardContent>
        </Card>
      )}

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Atendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Atendentes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dadosDashboard?.resumo?.totalAtendentes || 0}
            </div>
            {dadosDashboard?.tendencias?.totalAtendentes && (
              <p className="text-xs text-muted-foreground">
                <span
                  className={cn(
                    dadosDashboard.tendencias.totalAtendentes > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {dadosDashboard.tendencias.totalAtendentes > 0 ? '+' : ''}
                  {dadosDashboard.tendencias.totalAtendentes}%
                </span>{' '}
                em relação ao período anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Avaliação Média */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avaliação Média
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dadosDashboard?.resumo?.avaliacoes?.mediaGeral?.toFixed(1) ||
                '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dadosDashboard?.resumo?.avaliacoes?.total || 0} avaliações
            </p>
          </CardContent>
        </Card>

        {/* Documentos Criados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documentos Criados
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dadosDashboard?.resumo?.documentosCriados || 0}
            </div>
            {dadosDashboard?.tendencias?.documentosCriados && (
              <p className="text-xs text-muted-foreground">
                <span
                  className={cn(
                    dadosDashboard.tendencias.documentosCriados > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {dadosDashboard.tendencias.documentosCriados > 0 ? '+' : ''}
                  {dadosDashboard.tendencias.documentosCriados}%
                </span>{' '}
                vs período anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alterações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alterações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dadosDashboard?.resumo?.alteracoes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Modificações no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Performance */}
      {dadosDashboard?.metricas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Indicadores de Performance
            </CardTitle>
            <CardDescription>
              Métricas consolidadas de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    obterCorIndicador(dadosDashboard.metricas.produtividade)
                  )}
                >
                  {dadosDashboard.metricas.produtividade}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Produtividade
                </div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    obterCorIndicador(dadosDashboard.metricas.qualidade)
                  )}
                >
                  {dadosDashboard.metricas.qualidade}%
                </div>
                <div className="text-sm text-muted-foreground">Qualidade</div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    obterCorIndicador(dadosDashboard.metricas.pontualidade)
                  )}
                >
                  {dadosDashboard.metricas.pontualidade}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Pontualidade
                </div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    obterCorIndicador(
                      dadosDashboard.metricas.satisfacao,
                      'nota'
                    )
                  )}
                >
                  {dadosDashboard.metricas.satisfacao.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDashboard?.resumo?.atendentesPorStatus && (
              <div className="space-y-3">
                {Object.entries(dadosDashboard.resumo.atendentesPorStatus).map(
                  ([status, quantidade]) => {
                    const total = dadosDashboard.resumo.totalAtendentes;
                    const percentual =
                      total > 0 ? ((quantidade as number) / total) * 100 : 0;

                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              status === 'ativo'
                                ? 'default'
                                : status === 'inativo'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {quantidade as number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentual.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Desempenho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosDashboard?.resumo?.desempenho && (
              <div className="space-y-3">
                {Object.entries(dadosDashboard.resumo.desempenho).map(
                  ([nivel, quantidade]) => {
                    const cores = {
                      excelente: 'bg-green-100 text-green-800',
                      bom: 'bg-blue-100 text-blue-800',
                      regular: 'bg-yellow-100 text-yellow-800',
                      ruim: 'bg-red-100 text-red-800',
                    };

                    return (
                      <div
                        key={nivel}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={cores[nivel as keyof typeof cores]}>
                            {nivel}
                          </Badge>
                        </div>
                        <span className="font-semibold">
                          {quantidade as number}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {dadosDashboard?.topPerformers &&
        dadosDashboard.topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Atendentes com melhor desempenho no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dadosDashboard.topPerformers
                  .slice(0, 5)
                  .map((atendente, index) => (
                    <div
                      key={atendente.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{atendente.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {atendente.cargo} • {atendente.setor}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {atendente.pontuacao}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ⭐ {atendente.avaliacaoMedia.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alertas */}
      {dadosDashboard?.resumo?.alertas &&
        dadosDashboard.resumo.alertas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas e Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dadosDashboard.resumo.alertas.map((alerta, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border-l-4',
                      alerta.tipo === 'error' && 'border-l-red-500 bg-red-50',
                      alerta.tipo === 'warning' &&
                        'border-l-yellow-500 bg-yellow-50',
                      alerta.tipo === 'info' && 'border-l-blue-500 bg-blue-50'
                    )}
                  >
                    <p className="text-sm">{alerta.mensagem}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Dashboard Principal */}
      <DashboardMetricas
        dados={dadosDashboard}
        periodo={filtros.periodo}
        tempoReal
      />
    </div>
  );
}
