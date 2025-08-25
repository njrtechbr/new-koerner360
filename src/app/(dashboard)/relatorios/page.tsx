'use client';

import { useState, useEffect } from 'react';
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
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  Calendar,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface RelatorioData {
  periodo: string;
  atendimentos: number;
  avaliacaoMedia: number;
  feedbacksPositivos: number;
  feedbacksNegativos: number;
  tempoMedioAtendimento: number;
}

interface AtendentesPerformance {
  nome: string;
  atendimentos: number;
  avaliacaoMedia: number;
  feedbacks: number;
  pontuacao: number;
}

const mockRelatorioData: RelatorioData[] = [
  {
    periodo: 'Jan 2024',
    atendimentos: 150,
    avaliacaoMedia: 4.2,
    feedbacksPositivos: 120,
    feedbacksNegativos: 30,
    tempoMedioAtendimento: 15,
  },
  {
    periodo: 'Fev 2024',
    atendimentos: 180,
    avaliacaoMedia: 4.5,
    feedbacksPositivos: 145,
    feedbacksNegativos: 35,
    tempoMedioAtendimento: 12,
  },
  {
    periodo: 'Mar 2024',
    atendimentos: 200,
    avaliacaoMedia: 4.3,
    feedbacksPositivos: 160,
    feedbacksNegativos: 40,
    tempoMedioAtendimento: 14,
  },
];

const mockAtendentesPerformance: AtendentesPerformance[] = [
  {
    nome: 'João Silva',
    atendimentos: 85,
    avaliacaoMedia: 4.6,
    feedbacks: 12,
    pontuacao: 920,
  },
  {
    nome: 'Ana Costa',
    atendimentos: 92,
    avaliacaoMedia: 4.4,
    feedbacks: 8,
    pontuacao: 880,
  },
  {
    nome: 'Pedro Santos',
    atendimentos: 78,
    avaliacaoMedia: 4.2,
    feedbacks: 15,
    pontuacao: 750,
  },
];

const feedbackDistribution = [
  { name: 'Elogios', value: 45, color: '#22c55e' },
  { name: 'Sugestões', value: 25, color: '#3b82f6' },
  { name: 'Reclamações', value: 20, color: '#ef4444' },
  { name: 'Melhorias', value: 10, color: '#f59e0b' },
];

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  });
  const [tipoRelatorio, setTipoRelatorio] = useState('geral');
  const [periodoAgrupamento, setPeriodoAgrupamento] = useState('mensal');
  const [isLoading, setIsLoading] = useState(false);

  const handleExportarRelatorio = (formato: 'pdf' | 'excel' | 'csv') => {
    setIsLoading(true);
    // Simular exportação
    setTimeout(() => {
      setIsLoading(false);
      toast.success(
        `Relatório exportado em ${formato.toUpperCase()} com sucesso!`
      );
    }, 2000);
  };

  const calcularTotais = () => {
    const totalAtendimentos = mockRelatorioData.reduce(
      (acc, item) => acc + item.atendimentos,
      0
    );
    const avaliacaoMediaGeral =
      mockRelatorioData.reduce((acc, item) => acc + item.avaliacaoMedia, 0) /
      mockRelatorioData.length;
    const totalFeedbacksPositivos = mockRelatorioData.reduce(
      (acc, item) => acc + item.feedbacksPositivos,
      0
    );
    const totalFeedbacksNegativos = mockRelatorioData.reduce(
      (acc, item) => acc + item.feedbacksNegativos,
      0
    );
    const tempoMedioGeral =
      mockRelatorioData.reduce(
        (acc, item) => acc + item.tempoMedioAtendimento,
        0
      ) / mockRelatorioData.length;

    return {
      totalAtendimentos,
      avaliacaoMediaGeral: avaliacaoMediaGeral.toFixed(1),
      totalFeedbacksPositivos,
      totalFeedbacksNegativos,
      tempoMedioGeral: tempoMedioGeral.toFixed(0),
    };
  };

  const totais = calcularTotais();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e métricas de desempenho do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportarRelatorio('pdf')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportarRelatorio('excel')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportarRelatorio('csv')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Relatório Geral</SelectItem>
                  <SelectItem value="atendentes">
                    Performance de Atendentes
                  </SelectItem>
                  <SelectItem value="feedbacks">
                    Análise de Feedbacks
                  </SelectItem>
                  <SelectItem value="avaliacoes">
                    Relatório de Avaliações
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agrupamento">Agrupamento</Label>
              <Select
                value={periodoAgrupamento}
                onValueChange={setPeriodoAgrupamento}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Atendimentos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.totalAtendimentos}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao período anterior
            </p>
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
              {totais.avaliacaoMediaGeral}
            </div>
            <p className="text-xs text-muted-foreground">
              +0.3 pontos em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feedbacks Positivos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totais.totalFeedbacksPositivos}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feedbacks Negativos
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totais.totalFeedbacksNegativos}
            </div>
            <p className="text-xs text-muted-foreground">
              -5% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio (min)
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.tempoMedioGeral}</div>
            <p className="text-xs text-muted-foreground">
              -2 min em relação ao período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="atendimentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="atendimentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Atendimentos</CardTitle>
              <CardDescription>
                Número de atendimentos realizados por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockRelatorioData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="atendimentos"
                    fill="#3b82f6"
                    name="Atendimentos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Avaliações</CardTitle>
              <CardDescription>
                Média das avaliações recebidas por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockRelatorioData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avaliacaoMedia"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Avaliação Média"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Feedbacks</CardTitle>
                <CardDescription>Tipos de feedbacks recebidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feedbackDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Feedbacks por Período</CardTitle>
                <CardDescription>
                  Evolução dos feedbacks positivos vs negativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockRelatorioData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="feedbacksPositivos"
                      fill="#22c55e"
                      name="Positivos"
                    />
                    <Bar
                      dataKey="feedbacksNegativos"
                      fill="#ef4444"
                      name="Negativos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Atendentes</CardTitle>
              <CardDescription>
                Ranking de performance baseado em múltiplas métricas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAtendentesPerformance.map((atendente, index) => (
                  <div
                    key={atendente.nome}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{atendente.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {atendente.atendimentos} atendimentos • Avaliação:{' '}
                          {atendente.avaliacaoMedia}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {atendente.pontuacao} pts
                      </div>
                      <Badge
                        variant={
                          index === 0
                            ? 'default'
                            : index === 1
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {index === 0
                          ? '🥇 1º Lugar'
                          : index === 1
                            ? '🥈 2º Lugar'
                            : '🥉 3º Lugar'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
