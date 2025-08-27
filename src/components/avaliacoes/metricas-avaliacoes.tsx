'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  MetricasAtendente, 
  MetricasPeriodo, 
  ComparativoTemporal, 
  FiltrosMetricas 
} from '@/lib/utils/metricas-avaliacoes';

interface MetricasAvaliacoesProps {
  className?: string;
}

interface DadosConsolidados {
  totalAvaliacoes: number;
  mediaGeral: number;
  medianaGeral: number;
  desvioPadraoGeral: number;
  distribuicaoGeral: {
    nota1: number;
    nota2: number;
    nota3: number;
    nota4: number;
    nota5: number;
  };
  atendentesAvaliados: number;
  periodosAtivos: number;
}

interface Periodo {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: string;
}

interface Atendente {
  id: string;
  nome: string;
  setor: string;
  departamento?: string;
}

const CORES_GRAFICOS = {
  primaria: '#3b82f6',
  secundaria: '#10b981',
  terciaria: '#f59e0b',
  quaternaria: '#ef4444',
  quinaria: '#8b5cf6'
};

const CORES_NOTAS = {
  nota1: '#ef4444', // Vermelho
  nota2: '#f97316', // Laranja
  nota3: '#eab308', // Amarelo
  nota4: '#22c55e', // Verde claro
  nota5: '#16a34a'  // Verde escuro
};

export default function MetricasAvaliacoes({ className }: MetricasAvaliacoesProps) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dadosConsolidados, setDadosConsolidados] = useState<DadosConsolidados | null>(null);
  const [rankingAtendentes, setRankingAtendentes] = useState<MetricasAtendente[]>([]);
  const [comparativoTemporal, setComparativoTemporal] = useState<ComparativoTemporal[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [filtros, setFiltros] = useState<FiltrosMetricas>({});
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
    carregarPeriodos();
    carregarAtendentes();
  }, []);

  // Recarregar dados quando filtros mudarem
  useEffect(() => {
    if (!carregando) {
      carregarDados();
    }
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const [consolidados, ranking, comparativo] = await Promise.all([
        fetch('/api/avaliacoes/metricas/consolidadas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filtros })
        }).then(res => res.json()),
        fetch('/api/avaliacoes/metricas/ranking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filtros, limite: 10 })
        }).then(res => res.json()),
        fetch('/api/avaliacoes/metricas/comparativo-temporal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filtros })
        }).then(res => res.json())
      ]);

      setDadosConsolidados(consolidados.data);
      setRankingAtendentes(ranking.data);
      setComparativoTemporal(comparativo.data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setErro('Erro ao carregar dados das métricas');
    } finally {
      setCarregando(false);
    }
  };

  const carregarPeriodos = async () => {
    try {
      const response = await fetch('/api/periodos-avaliacao');
      const data = await response.json();
      setPeriodos(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar períodos:', error);
    }
  };

  const carregarAtendentes = async () => {
    try {
      const response = await fetch('/api/atendentes');
      const data = await response.json();
      setAtendentes(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
    }
  };

  const aplicarFiltro = (novosFiltros: Partial<FiltrosMetricas>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  const limparFiltros = () => {
    setFiltros({});
  };

  const exportarRelatorio = async () => {
    try {
      const response = await fetch('/api/avaliacoes/metricas/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filtros })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metricas-avaliacoes-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  // Preparar dados para gráficos
  const dadosDistribuicao = dadosConsolidados ? [
    { nota: 'Nota 1', quantidade: dadosConsolidados.distribuicaoGeral.nota1, cor: CORES_NOTAS.nota1 },
    { nota: 'Nota 2', quantidade: dadosConsolidados.distribuicaoGeral.nota2, cor: CORES_NOTAS.nota2 },
    { nota: 'Nota 3', quantidade: dadosConsolidados.distribuicaoGeral.nota3, cor: CORES_NOTAS.nota3 },
    { nota: 'Nota 4', quantidade: dadosConsolidados.distribuicaoGeral.nota4, cor: CORES_NOTAS.nota4 },
    { nota: 'Nota 5', quantidade: dadosConsolidados.distribuicaoGeral.nota5, cor: CORES_NOTAS.nota5 }
  ] : [];

  const dadosRanking = rankingAtendentes.map(atendente => ({
    nome: atendente.nomeAtendente.split(' ')[0], // Apenas primeiro nome
    media: atendente.media,
    total: atendente.totalAvaliacoes,
    setor: atendente.setor
  }));

  const dadosComparativo = comparativoTemporal.map(periodo => ({
    periodo: periodo.nomePeriodo,
    media: periodo.mediaGeral,
    total: periodo.totalAvaliacoes,
    data: new Date(periodo.dataInicio).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }));

  if (erro) {
    return (
      <Alert className="m-4">
        <AlertDescription>{erro}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Métricas de Avaliações</h2>
          <p className="text-muted-foreground">Análise estatística e comparativa das avaliações 360°</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select onValueChange={(value) => aplicarFiltro({ periodoIds: value ? [value] : undefined })}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              {periodos.map(periodo => (
                <SelectItem key={periodo.id} value={periodo.id}>
                  {periodo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={limparFiltros}>
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
          
          <Button variant="outline" size="sm" onClick={carregarDados}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportarRelatorio}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      {carregando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : dadosConsolidados && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Avaliações</CardDescription>
              <CardTitle className="text-2xl">{dadosConsolidados.totalAvaliacoes}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                {dadosConsolidados.atendentesAvaliados} atendentes
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Média Geral</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                {dadosConsolidados.mediaGeral.toFixed(2)}
                {dadosConsolidados.mediaGeral >= 4 ? (
                  <TrendingUp className="h-5 w-5 ml-2 text-green-500" />
                ) : dadosConsolidados.mediaGeral >= 3 ? (
                  <BarChart3 className="h-5 w-5 ml-2 text-yellow-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 ml-2 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                Mediana: {dadosConsolidados.medianaGeral.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Desvio Padrão</CardDescription>
              <CardTitle className="text-2xl">{dadosConsolidados.desvioPadraoGeral.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                {dadosConsolidados.desvioPadraoGeral <= 1 ? (
                  <Badge variant="secondary" className="text-xs">Baixa variação</Badge>
                ) : dadosConsolidados.desvioPadraoGeral <= 1.5 ? (
                  <Badge variant="outline" className="text-xs">Variação moderada</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Alta variação</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Períodos Ativos</CardDescription>
              <CardTitle className="text-2xl">{dadosConsolidados.periodosAtivos}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Com avaliações
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas de visualização */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="temporal">Evolução</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de distribuição de notas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Distribuição de Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosDistribuicao}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="quantidade"
                        label={({ nota, quantidade }) => `${nota}: ${quantidade}`}
                      >
                        {dadosDistribuicao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top 5 atendentes */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Atendentes</CardTitle>
                <CardDescription>Melhores médias de avaliação</CardDescription>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankingAtendentes.slice(0, 5).map((atendente, index) => (
                      <div key={atendente.atendenteId} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{atendente.nomeAtendente}</p>
                          <p className="text-xs text-muted-foreground">{atendente.setor}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{atendente.media.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{atendente.totalAvaliacoes} aval.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Atendentes</CardTitle>
              <CardDescription>Classificação por média de avaliações</CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dadosRanking} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="nome" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'media' ? `${value} (média)` : `${value} avaliações`,
                        name === 'media' ? 'Média' : 'Total'
                      ]}
                    />
                    <Bar dataKey="media" fill={CORES_GRAFICOS.primaria} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal</CardTitle>
              <CardDescription>Média de avaliações por período</CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dadosComparativo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'media' ? `${value} (média)` : `${value} avaliações`,
                        name === 'media' ? 'Média' : 'Total'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="media" 
                      stroke={CORES_GRAFICOS.primaria} 
                      strokeWidth={2}
                      dot={{ fill: CORES_GRAFICOS.primaria, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Detalhada</CardTitle>
              <CardDescription>Análise da distribuição de notas</CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : dadosConsolidados && (
                <div className="space-y-4">
                  {Object.entries(dadosConsolidados.distribuicaoGeral).map(([nota, quantidade]) => {
                    const porcentagem = dadosConsolidados.totalAvaliacoes > 0 
                      ? (quantidade / dadosConsolidados.totalAvaliacoes) * 100 
                      : 0;
                    
                    return (
                      <div key={nota} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {nota.replace('nota', 'Nota ')} ⭐
                          </span>
                          <span className="text-muted-foreground">
                            {quantidade} ({porcentagem.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={porcentagem} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}