'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Star,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth';
import { DashboardMetricas } from '@/components/dashboard/dashboard-metricas';
import { ComparativoAtendentes } from '@/components/dashboard/comparativo-atendentes';
import { GraficosDesempenho } from '@/components/dashboard/graficos-desempenho';
import { IndicadoresProdutividade } from '@/components/dashboard/indicadores-produtividade';
import { ResumoStatus } from '@/components/dashboard/resumo-status';

interface DashboardData {
  periodo: {
    dataInicio: string;
    dataFim: string;
    periodo: string;
  };
  filtros: {
    setor?: string;
    cargo?: string;
    status?: string;
  };
  resumoGeral: {
    totalAtendentes: number;
    atendentesPorStatus: Record<string, number>;
    atendentesPorSetor: Record<string, number>;
    atendentesPorCargo: Record<string, number>;
  };
  metricas: {
    documentos: {
      totalNoPeriodo: number;
      mediaPorAtendente: number;
    };
    avaliacoes: {
      totalNoPeriodo: number;
      mediaGeral: number;
      distribuicaoPerformance: Record<string, number>;
    };
    atividade: {
      totalAlteracoes: number;
      alteracoesPorTipo: Record<string, number>;
    };
  };
  topPerformers: Array<{
    id: string;
    nome: string;
    cargo: string;
    setor: string;
    mediaAvaliacoes: number;
    totalDocumentos: number;
  }>;
  tendencias: {
    documentos: {
      atual: number;
      anterior: number;
      variacao: number;
    };
    avaliacoes: {
      atual: number;
      anterior: number;
      variacao: number;
    };
  };
  insights: {
    atendentesMaisAtivos: boolean;
    performanceGeral: string;
    crescimentoDocumentos: boolean;
    melhoriaAvaliacoes: boolean;
  };
}

interface Filtros {
  periodo: '7d' | '30d' | '90d' | '1y' | 'custom';
  setor?: string;
  cargo?: string;
  status?: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  dataInicio?: string;
  dataFim?: string;
}

export default function AtendentesPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [carregando, setCarregando] = useState(true);
  const [atualizandoAutomatico, setAtualizandoAutomatico] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [abaSelecionada, setAbaSelecionada] = useState('visao-geral');
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: '30d',
  });

  // Carregar dados do dashboard
  const carregarDashboard = async (mostrarCarregamento = true) => {
    try {
      if (mostrarCarregamento) {
        setCarregando(true);
      }

      const params = new URLSearchParams();
      params.append('periodo', filtros.periodo);

      if (filtros.setor) params.append('setor', filtros.setor);
      if (filtros.cargo) params.append('cargo', filtros.cargo);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await fetch(`/api/atendentes/dashboard?${params}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar dashboard');
      }

      const data = await response.json();
      setDashboardData(data.dashboard);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      if (mostrarCarregamento) {
        setCarregando(false);
      }
    }
  };

  // Atualização automática a cada 5 minutos
  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    if (atualizandoAutomatico) {
      intervalo = setInterval(
        () => {
          carregarDashboard(false);
        },
        5 * 60 * 1000
      ); // 5 minutos
    }

    return () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, [atualizandoAutomatico]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDashboard();
  }, [filtros]);

  // Aplicar filtros
  const aplicarFiltros = (novosFiltros: Partial<Filtros>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({ periodo: '30d' });
  };

  // Exportar dados
  const exportarDados = async () => {
    try {
      const params = new URLSearchParams();
      params.append('formato', 'excel');
      params.append('periodo', filtros.periodo);

      if (filtros.setor) params.append('setor', filtros.setor);
      if (filtros.cargo) params.append('cargo', filtros.cargo);
      if (filtros.status) params.append('status', filtros.status);

      const response = await fetch(
        `/api/atendentes/dashboard/exportar?${params}`
      );

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-atendentes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  // Renderizar indicador de tendência
  const renderizarTendencia = (variacao: number) => {
    const isPositivo = variacao > 0;
    const Icon = isPositivo ? TrendingUp : TrendingDown;
    const cor = isPositivo ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 ${cor}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {Math.abs(variacao).toFixed(1)}%
        </span>
      </div>
    );
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requiredPermissions={['visualizar_atendentes']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard de Atendentes
            </h1>
            <p className="text-muted-foreground">
              Métricas, análises e insights sobre o desempenho dos atendentes
            </p>
            {ultimaAtualizacao && (
              <p className="text-xs text-muted-foreground mt-1">
                Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAtualizandoAutomatico(!atualizandoAutomatico)}
              className={
                atualizandoAutomatico ? 'bg-green-50 border-green-200' : ''
              }
            >
              <Activity className="h-4 w-4 mr-2" />
              {atualizandoAutomatico
                ? 'Auto-atualização ON'
                : 'Auto-atualização OFF'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => carregarDashboard(false)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>

            <Button variant="outline" size="sm" onClick={exportarDados}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button size="sm" onClick={() => router.push('/atendentes/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendente
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Configure os filtros para personalizar a visualização dos dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <Select
                value={filtros.periodo}
                onValueChange={value =>
                  aplicarFiltros({ periodo: value as Filtros['periodo'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.setor || 'todos'}
                onValueChange={value =>
                  aplicarFiltros({
                    setor: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os setores</SelectItem>
                  <SelectItem value="Atendimento">Atendimento</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Suporte">Suporte</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.cargo || 'todos'}
                onValueChange={value =>
                  aplicarFiltros({
                    cargo: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os cargos</SelectItem>
                  <SelectItem value="Atendente">Atendente</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Coordenador">Coordenador</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.status || 'todos'}
                onValueChange={value =>
                  aplicarFiltros({
                    status:
                      value === 'todos'
                        ? undefined
                        : (value as Filtros['status']),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={limparFiltros}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>

            {filtros.periodo === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={filtros.dataInicio || ''}
                    onChange={e =>
                      aplicarFiltros({ dataInicio: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={filtros.dataFim || ''}
                    onChange={e => aplicarFiltros({ dataFim: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        {dashboardData && (
          <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="metricas">Métricas</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral" className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Atendentes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.resumoGeral.totalAtendentes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Atendentes cadastrados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Documentos no Período
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.metricas.documentos.totalNoPeriodo}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Média:{' '}
                        {dashboardData.metricas.documentos.mediaPorAtendente}
                        /atendente
                      </p>
                      {renderizarTendencia(
                        dashboardData.tendencias.documentos.variacao
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avaliação Média
                    </CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.metricas.avaliacoes.mediaGeral}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.metricas.avaliacoes.totalNoPeriodo}{' '}
                        avaliações
                      </p>
                      {renderizarTendencia(
                        dashboardData.tendencias.avaliacoes.variacao
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Atividade Total
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.metricas.atividade.totalAlteracoes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alterações no período
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo de Status */}
              <ResumoStatus dados={dashboardData} />

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>
                    Atendentes com melhor desempenho no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.topPerformers.map((atendente, index) => (
                      <div
                        key={atendente.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{atendente.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {atendente.cargo} - {atendente.setor}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                              {atendente.mediaAvaliacoes.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {atendente.totalDocumentos} documentos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Insights</CardTitle>
                  <CardDescription>
                    Análises automáticas baseadas nos dados do período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          dashboardData.insights.performanceGeral ===
                          'Excelente'
                            ? 'bg-green-500'
                            : dashboardData.insights.performanceGeral === 'Boa'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium">Performance Geral</p>
                        <p className="text-sm text-muted-foreground">
                          {dashboardData.insights.performanceGeral}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          dashboardData.insights.crescimentoDocumentos
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium">Produtividade</p>
                        <p className="text-sm text-muted-foreground">
                          {dashboardData.insights.crescimentoDocumentos
                            ? 'Em crescimento'
                            : 'Em declínio'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metricas" className="space-y-6">
              <DashboardMetricas />
            </TabsContent>

            <TabsContent value="comparativo" className="space-y-6">
              <ComparativoAtendentes />
            </TabsContent>

            <TabsContent value="historico" className="space-y-6">
              <GraficosDesempenho />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AuthGuard>
  );
}
