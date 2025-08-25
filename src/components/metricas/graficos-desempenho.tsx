'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interface para dados de métricas
 */
interface DadosMetricas {
  atendente?: {
    id: string;
    nome: string;
    cargo: string;
    setor: string;
  };
  periodo: {
    dataInicio: string;
    dataFim: string;
    periodo: string;
  };
  avaliacoes: {
    total: number;
    media: number;
    ultima?: {
      nota: number;
      data: string;
    };
  };
  documentos: {
    total: number;
    ativosNoPeriodo: number;
  };
  atividade: {
    totalAlteracoes: number;
    porTipo: Record<string, number>;
  };
  resumo: {
    produtividade: string;
    statusGeral: string;
  };
}

/**
 * Interface para dados do dashboard
 */
interface DadosDashboard {
  resumoGeral: {
    totalAtendentes: number;
    atendentesPorStatus: Record<string, number>;
    atendentesPorSetor: Record<string, number>;
  };
  metricas: {
    avaliacoes: {
      mediaGeral: number;
      distribuicaoPerformance: {
        alta: number;
        media: number;
        baixa: number;
      };
    };
    documentos: {
      totalNoPeriodo: number;
      mediaPorAtendente: number;
    };
  };
  tendencias: {
    avaliacoes: {
      atual: number;
      anterior: number;
      variacao: number;
    };
    documentos: {
      atual: number;
      anterior: number;
      variacao: number;
    };
  };
  topPerformers: Array<{
    id: string;
    nome: string;
    cargo: string;
    mediaAvaliacoes: number;
  }>;
}

/**
 * Props do componente
 */
interface GraficosDesempenhoProps {
  atendenteId?: string;
  dadosMetricas?: DadosMetricas;
  dadosDashboard?: DadosDashboard;
  carregando?: boolean;
  erro?: string;
  className?: string;
}

/**
 * Cores para os gráficos
 */
const CORES = {
  primaria: '#3b82f6',
  secundaria: '#10b981',
  terciaria: '#f59e0b',
  quaternaria: '#ef4444',
  quinaria: '#8b5cf6',
  sexta: '#06b6d4',
};

const CORES_STATUS = {
  ATIVO: '#10b981',
  INATIVO: '#6b7280',
  SUSPENSO: '#ef4444',
};

const CORES_PERFORMANCE = {
  alta: '#10b981',
  media: '#f59e0b',
  baixa: '#ef4444',
};

/**
 * Componente de gráficos de desempenho
 */
export function GraficosDesempenho({
  atendenteId,
  dadosMetricas,
  dadosDashboard,
  carregando = false,
  erro,
  className,
}: GraficosDesempenhoProps) {
  const [abaSelecionada, setAbaSelecionada] = useState('visao-geral');

  // Preparar dados para gráficos individuais
  const prepararDadosIndividuais = () => {
    if (!dadosMetricas) return null;

    // Dados de atividade por tipo
    const dadosAtividade = Object.entries(dadosMetricas.atividade.porTipo).map(
      ([tipo, quantidade]) => ({
        tipo: tipo
          .replace('_', ' ')
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase()),
        quantidade,
        porcentagem: (
          (quantidade / dadosMetricas.atividade.totalAlteracoes) *
          100
        ).toFixed(1),
      })
    );

    // Dados de produtividade
    const dadosProdutividade = [
      {
        categoria: 'Documentos',
        valor: dadosMetricas.documentos.total,
        meta: 10, // Meta exemplo
        porcentagem: Math.min((dadosMetricas.documentos.total / 10) * 100, 100),
      },
      {
        categoria: 'Avaliações',
        valor: dadosMetricas.avaliacoes.media,
        meta: 10,
        porcentagem: (dadosMetricas.avaliacoes.media / 10) * 100,
      },
      {
        categoria: 'Atividade',
        valor: dadosMetricas.atividade.totalAlteracoes,
        meta: 20,
        porcentagem: Math.min(
          (dadosMetricas.atividade.totalAlteracoes / 20) * 100,
          100
        ),
      },
    ];

    return { dadosAtividade, dadosProdutividade };
  };

  // Preparar dados para dashboard geral
  const prepararDadosDashboard = () => {
    if (!dadosDashboard) return null;

    // Dados de status dos atendentes
    const dadosStatus = Object.entries(
      dadosDashboard.resumoGeral.atendentesPorStatus
    ).map(([status, quantidade]) => ({
      status,
      quantidade,
      porcentagem: (
        (quantidade / dadosDashboard.resumoGeral.totalAtendentes) *
        100
      ).toFixed(1),
    }));

    // Dados de performance
    const dadosPerformance = Object.entries(
      dadosDashboard.metricas.avaliacoes.distribuicaoPerformance
    ).map(([nivel, quantidade]) => ({
      nivel: nivel.charAt(0).toUpperCase() + nivel.slice(1),
      quantidade,
      porcentagem: (
        (quantidade /
          (dadosDashboard.metricas.avaliacoes.distribuicaoPerformance.alta +
            dadosDashboard.metricas.avaliacoes.distribuicaoPerformance.media +
            dadosDashboard.metricas.avaliacoes.distribuicaoPerformance.baixa)) *
        100
      ).toFixed(1),
    }));

    // Dados de setores
    const dadosSetores = Object.entries(
      dadosDashboard.resumoGeral.atendentesPorSetor
    ).map(([setor, quantidade]) => ({
      setor,
      quantidade,
      porcentagem: (
        (quantidade / dadosDashboard.resumoGeral.totalAtendentes) *
        100
      ).toFixed(1),
    }));

    return { dadosStatus, dadosPerformance, dadosSetores };
  };

  // Renderizar indicador de tendência
  const renderizarTendencia = (variacao: number) => {
    if (variacao > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">+{variacao.toFixed(1)}%</span>
        </div>
      );
    } else if (variacao < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{variacao.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">0%</span>
        </div>
      );
    }
  };

  if (carregando) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando gráficos...</span>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <p className="text-red-600">Erro ao carregar gráficos: {erro}</p>
      </div>
    );
  }

  const dadosIndividuais = prepararDadosIndividuais();
  const dadosGerais = prepararDadosDashboard();

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          {atendenteId && (
            <TabsTrigger value="individual">Individual</TabsTrigger>
          )}
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          {dadosDashboard && dadosGerais && (
            <>
              {/* Métricas de Tendência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Avaliações
                      {renderizarTendencia(
                        dadosDashboard.tendencias.avaliacoes.variacao
                      )}
                    </CardTitle>
                    <CardDescription>
                      Média geral:{' '}
                      {dadosDashboard.metricas.avaliacoes.mediaGeral.toFixed(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dadosGerais.dadosPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nivel" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill={CORES.primaria} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Documentos
                      {renderizarTendencia(
                        dadosDashboard.tendencias.documentos.variacao
                      )}
                    </CardTitle>
                    <CardDescription>
                      Total no período:{' '}
                      {dadosDashboard.metricas.documentos.totalNoPeriodo}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Média por atendente</span>
                        <Badge variant="secondary">
                          {dadosDashboard.metricas.documentos.mediaPorAtendente}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min((dadosDashboard.metricas.documentos.mediaPorAtendente / 10) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status dos Atendentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                  <CardDescription>
                    Total de {dadosDashboard.resumoGeral.totalAtendentes}{' '}
                    atendentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosGerais.dadosStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, porcentagem }) =>
                          `${status} (${porcentagem}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {dadosGerais.dadosStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CORES_STATUS[
                                entry.status as keyof typeof CORES_STATUS
                              ] || CORES.primaria
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performers */}
              {dadosDashboard.topPerformers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>
                      Atendentes com melhor desempenho
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dadosDashboard.topPerformers.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Bar
                          dataKey="mediaAvaliacoes"
                          fill={CORES.secundaria}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Individual */}
        {atendenteId && (
          <TabsContent value="individual" className="space-y-6">
            {dadosMetricas && dadosIndividuais && (
              <>
                {/* Informações do Atendente */}
                {dadosMetricas.atendente && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{dadosMetricas.atendente.nome}</CardTitle>
                      <CardDescription>
                        {dadosMetricas.atendente.cargo} -{' '}
                        {dadosMetricas.atendente.setor}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {dadosMetricas.avaliacoes.media.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Média Avaliações
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {dadosMetricas.documentos.total}
                          </div>
                          <div className="text-sm text-gray-500">
                            Documentos
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {dadosMetricas.atividade.totalAlteracoes}
                          </div>
                          <div className="text-sm text-gray-500">
                            Atividades
                          </div>
                        </div>
                        <div className="text-center">
                          <Badge
                            variant={
                              dadosMetricas.resumo.produtividade === 'Alta'
                                ? 'default'
                                : dadosMetricas.resumo.produtividade === 'Média'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {dadosMetricas.resumo.produtividade}
                          </Badge>
                          <div className="text-sm text-gray-500 mt-1">
                            Produtividade
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico de Atividades */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atividades por Tipo</CardTitle>
                    <CardDescription>
                      Distribuição das atividades realizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dadosIndividuais.dadosAtividade}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ tipo, porcentagem }) =>
                            `${tipo} (${porcentagem}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="quantidade"
                        >
                          {dadosIndividuais.dadosAtividade.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  Object.values(CORES)[
                                    index % Object.values(CORES).length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico de Produtividade */}
                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Produtividade</CardTitle>
                    <CardDescription>
                      Performance em relação às metas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dadosIndividuais.dadosProdutividade}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="categoria" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="valor"
                          fill={CORES.primaria}
                          name="Atual"
                        />
                        <Bar
                          dataKey="meta"
                          fill={CORES.secundaria}
                          name="Meta"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* Comparativo */}
        <TabsContent value="comparativo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa</CardTitle>
              <CardDescription>
                Em desenvolvimento - Comparação entre atendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Funcionalidade de comparação será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GraficosDesempenho;
