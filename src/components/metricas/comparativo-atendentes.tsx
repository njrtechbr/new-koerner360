'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  X,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Target,
  Clock,
  FileText,
  Star,
  Plus,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';

/**
 * Interface para dados de um atendente
 */
export interface DadosAtendente {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  status: 'ativo' | 'inativo' | 'licenca';
  avatar?: string;
  dataAdmissao: string;
  metricas: {
    documentosCriados: number;
    avaliacaoMedia: number;
    produtividade: number;
    pontualidade: number;
    qualidade: number;
    colaboracao: number;
    inovacao: number;
    resolucaoProblemas: number;
    comunicacao: number;
    lideranca: number;
    tempoMedioTarefa: number; // em horas
    tarefasConcluidas: number;
    tarefasPendentes: number;
    feedbacksPositivos: number;
    feedbacksNegativos: number;
  };
  tendencias: {
    documentos: 'up' | 'down' | 'stable';
    avaliacao: 'up' | 'down' | 'stable';
    produtividade: 'up' | 'down' | 'stable';
  };
}

/**
 * Interface para configurações de comparação
 */
export interface ConfiguracaoComparacao {
  metricasPrincipais: string[];
  tipoVisualizacao: 'barras' | 'radar' | 'linha' | 'tabela';
  ordenarPor: string;
  ordemCrescente: boolean;
  mostrarTendencias: boolean;
  destacarMelhor: boolean;
  destacarPior: boolean;
}

/**
 * Props do componente
 */
interface ComparativoAtendentesProps {
  atendentes: DadosAtendente[];
  onSelecionarAtendente?: (atendente: DadosAtendente) => void;
  onRemoverAtendente?: (id: string) => void;
  className?: string;
}

/**
 * Métricas disponíveis para comparação
 */
const METRICAS_DISPONIVEIS = [
  {
    key: 'documentosCriados',
    nome: 'Documentos Criados',
    icone: <FileText className="h-4 w-4" />,
    tipo: 'numero',
  },
  {
    key: 'avaliacaoMedia',
    nome: 'Avaliação Média',
    icone: <Star className="h-4 w-4" />,
    tipo: 'decimal',
  },
  {
    key: 'produtividade',
    nome: 'Produtividade',
    icone: <TrendingUp className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'pontualidade',
    nome: 'Pontualidade',
    icone: <Clock className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'qualidade',
    nome: 'Qualidade',
    icone: <Award className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'colaboracao',
    nome: 'Colaboração',
    icone: <Users className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'inovacao',
    nome: 'Inovação',
    icone: <Target className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'resolucaoProblemas',
    nome: 'Resolução de Problemas',
    icone: <Activity className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'comunicacao',
    nome: 'Comunicação',
    icone: <Users className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'lideranca',
    nome: 'Liderança',
    icone: <Award className="h-4 w-4" />,
    tipo: 'percentual',
  },
  {
    key: 'tempoMedioTarefa',
    nome: 'Tempo Médio por Tarefa',
    icone: <Clock className="h-4 w-4" />,
    tipo: 'tempo',
  },
  {
    key: 'tarefasConcluidas',
    nome: 'Tarefas Concluídas',
    icone: <Target className="h-4 w-4" />,
    tipo: 'numero',
  },
];

/**
 * Componente principal para comparação de atendentes
 */
export function ComparativoAtendentes({
  atendentes,
  onSelecionarAtendente,
  onRemoverAtendente,
  className,
}: ComparativoAtendentesProps) {
  const [atendentesSelecionados, setAtendentesSelecionados] = useState<
    DadosAtendente[]
  >([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoComparacao>({
    metricasPrincipais: [
      'documentosCriados',
      'avaliacaoMedia',
      'produtividade',
      'qualidade',
    ],
    tipoVisualizacao: 'barras',
    ordenarPor: 'avaliacaoMedia',
    ordemCrescente: false,
    mostrarTendencias: true,
    destacarMelhor: true,
    destacarPior: false,
  });
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filtrar atendentes disponíveis
  const atendentesDisponiveis = atendentes.filter(
    atendente =>
      !atendentesSelecionados.find(sel => sel.id === atendente.id) &&
      (atendente.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        atendente.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
        atendente.cargo.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  // Função para adicionar atendente à comparação
  const adicionarAtendente = (atendente: DadosAtendente) => {
    if (atendentesSelecionados.length < 6) {
      setAtendentesSelecionados(prev => [...prev, atendente]);
      onSelecionarAtendente?.(atendente);
    }
  };

  // Função para remover atendente da comparação
  const removerAtendente = (id: string) => {
    setAtendentesSelecionados(prev => prev.filter(a => a.id !== id));
    onRemoverAtendente?.(id);
  };

  // Função para obter valor da métrica
  const obterValorMetrica = (
    atendente: DadosAtendente,
    metrica: string
  ): number => {
    return (atendente.metricas as any)[metrica] || 0;
  };

  // Função para formatar valor da métrica
  const formatarValor = (valor: number, tipo: string): string => {
    switch (tipo) {
      case 'percentual':
        return `${valor}%`;
      case 'decimal':
        return valor.toFixed(1);
      case 'tempo':
        return `${valor}h`;
      default:
        return valor.toString();
    }
  };

  // Função para obter ícone de tendência
  const obterIconeTendencia = (tendencia: 'up' | 'down' | 'stable') => {
    switch (tendencia) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  // Preparar dados para gráficos
  const prepararDadosGrafico = () => {
    return atendentesSelecionados.map(atendente => {
      const dados: any = {
        nome: atendente.nome.split(' ')[0], // Primeiro nome apenas
        nomeCompleto: atendente.nome,
      };

      configuracao.metricasPrincipais.forEach(metrica => {
        dados[metrica] = obterValorMetrica(atendente, metrica);
      });

      return dados;
    });
  };

  // Preparar dados para radar
  const prepararDadosRadar = () => {
    const metricas = configuracao.metricasPrincipais.map(key => {
      const metrica = METRICAS_DISPONIVEIS.find(m => m.key === key);
      return metrica?.nome || key;
    });

    return metricas.map(metrica => {
      const dados: any = { metrica };

      atendentesSelecionados.forEach(atendente => {
        const key = configuracao.metricasPrincipais.find(k => {
          const m = METRICAS_DISPONIVEIS.find(met => met.key === k);
          return m?.nome === metrica;
        });

        if (key) {
          dados[atendente.nome.split(' ')[0]] = obterValorMetrica(
            atendente,
            key
          );
        }
      });

      return dados;
    });
  };

  // Renderizar gráfico baseado no tipo selecionado
  const renderizarGrafico = () => {
    const dados = prepararDadosGrafico();
    const cores = [
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#ff7300',
      '#8dd1e1',
      '#d084d0',
    ];

    switch (configuracao.tipoVisualizacao) {
      case 'barras':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip
                labelFormatter={label => {
                  const atendente = atendentesSelecionados.find(
                    a => a.nome.split(' ')[0] === label
                  );
                  return atendente?.nome || label;
                }}
              />
              <Legend />
              {configuracao.metricasPrincipais.map((metrica, index) => {
                const metricaInfo = METRICAS_DISPONIVEIS.find(
                  m => m.key === metrica
                );
                return (
                  <Bar
                    key={metrica}
                    dataKey={metrica}
                    fill={cores[index % cores.length]}
                    name={metricaInfo?.nome || metrica}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        const dadosRadar = prepararDadosRadar();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={dadosRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metrica" />
              <PolarRadiusAxis />
              {atendentesSelecionados.map((atendente, index) => (
                <Radar
                  key={atendente.id}
                  name={atendente.nome.split(' ')[0]}
                  dataKey={atendente.nome.split(' ')[0]}
                  stroke={cores[index % cores.length]}
                  fill={cores[index % cores.length]}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'linha':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip
                labelFormatter={label => {
                  const atendente = atendentesSelecionados.find(
                    a => a.nome.split(' ')[0] === label
                  );
                  return atendente?.nome || label;
                }}
              />
              <Legend />
              {configuracao.metricasPrincipais.map((metrica, index) => {
                const metricaInfo = METRICAS_DISPONIVEIS.find(
                  m => m.key === metrica
                );
                return (
                  <Line
                    key={metrica}
                    type="monotone"
                    dataKey={metrica}
                    stroke={cores[index % cores.length]}
                    name={metricaInfo?.nome || metrica}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Selecione um tipo de visualização
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Comparativo de Atendentes</span>
          </CardTitle>
          <CardDescription>
            Compare métricas de desempenho entre diferentes atendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Busca e seleção de atendentes */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar atendentes por nome, email ou cargo..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </div>

            {/* Lista de atendentes disponíveis */}
            {termoBusca && (
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="text-sm font-medium mb-2">
                  Atendentes Disponíveis:
                </div>
                <div className="space-y-2">
                  {atendentesDisponiveis.slice(0, 5).map(atendente => (
                    <div
                      key={atendente.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => adicionarAtendente(atendente)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {atendente.nome.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {atendente.nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            {atendente.cargo} - {atendente.setor}
                          </div>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                  {atendentesDisponiveis.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      Nenhum atendente encontrado
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atendentes selecionados */}
      {atendentesSelecionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Atendentes Selecionados ({atendentesSelecionados.length}/6)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atendentesSelecionados.map(atendente => (
                <div
                  key={atendente.id}
                  className="border rounded-lg p-4 relative"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removerAtendente(atendente.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-blue-600">
                        {atendente.nome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{atendente.nome}</div>
                      <div className="text-sm text-gray-500">
                        {atendente.cargo}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avaliação:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">
                          {atendente.metricas.avaliacaoMedia.toFixed(1)}
                        </span>
                        {configuracao.mostrarTendencias &&
                          obterIconeTendencia(atendente.tendencias.avaliacao)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Documentos:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">
                          {atendente.metricas.documentosCriados}
                        </span>
                        {configuracao.mostrarTendencias &&
                          obterIconeTendencia(atendente.tendencias.documentos)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Produtividade:
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">
                          {atendente.metricas.produtividade}%
                        </span>
                        {configuracao.mostrarTendencias &&
                          obterIconeTendencia(
                            atendente.tendencias.produtividade
                          )}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      atendente.status === 'ativo' ? 'default' : 'secondary'
                    }
                    className="mt-2"
                  >
                    {atendente.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações de comparação */}
      {atendentesSelecionados.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Configurações de Comparação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de métricas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Métricas para Comparação
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {METRICAS_DISPONIVEIS.map(metrica => (
                  <div
                    key={metrica.key}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={metrica.key}
                      checked={configuracao.metricasPrincipais.includes(
                        metrica.key
                      )}
                      onCheckedChange={checked => {
                        if (checked) {
                          setConfiguracao(prev => ({
                            ...prev,
                            metricasPrincipais: [
                              ...prev.metricasPrincipais,
                              metrica.key,
                            ],
                          }));
                        } else {
                          setConfiguracao(prev => ({
                            ...prev,
                            metricasPrincipais: prev.metricasPrincipais.filter(
                              m => m !== metrica.key
                            ),
                          }));
                        }
                      }}
                    />
                    <Label
                      htmlFor={metrica.key}
                      className="text-sm flex items-center space-x-1"
                    >
                      {metrica.icone}
                      <span>{metrica.nome}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo de visualização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tipo de Visualização
                </Label>
                <Select
                  value={configuracao.tipoVisualizacao}
                  onValueChange={valor =>
                    setConfiguracao(prev => ({
                      ...prev,
                      tipoVisualizacao: valor as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barras">Gráfico de Barras</SelectItem>
                    <SelectItem value="radar">Gráfico Radar</SelectItem>
                    <SelectItem value="linha">Gráfico de Linha</SelectItem>
                    <SelectItem value="tabela">Tabela Comparativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Ordenar Por</Label>
                <Select
                  value={configuracao.ordenarPor}
                  onValueChange={valor =>
                    setConfiguracao(prev => ({ ...prev, ordenarPor: valor }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICAS_DISPONIVEIS.map(metrica => (
                      <SelectItem key={metrica.key} value={metrica.key}>
                        {metrica.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opções adicionais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mostrarTendencias"
                  checked={configuracao.mostrarTendencias}
                  onCheckedChange={checked =>
                    setConfiguracao(prev => ({
                      ...prev,
                      mostrarTendencias: !!checked,
                    }))
                  }
                />
                <Label htmlFor="mostrarTendencias" className="text-sm">
                  Mostrar Tendências
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="destacarMelhor"
                  checked={configuracao.destacarMelhor}
                  onCheckedChange={checked =>
                    setConfiguracao(prev => ({
                      ...prev,
                      destacarMelhor: !!checked,
                    }))
                  }
                />
                <Label htmlFor="destacarMelhor" className="text-sm">
                  Destacar Melhor
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="destacarPior"
                  checked={configuracao.destacarPior}
                  onCheckedChange={checked =>
                    setConfiguracao(prev => ({
                      ...prev,
                      destacarPior: !!checked,
                    }))
                  }
                />
                <Label htmlFor="destacarPior" className="text-sm">
                  Destacar Pior
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ordemCrescente"
                  checked={configuracao.ordemCrescente}
                  onCheckedChange={checked =>
                    setConfiguracao(prev => ({
                      ...prev,
                      ordemCrescente: !!checked,
                    }))
                  }
                />
                <Label htmlFor="ordemCrescente" className="text-sm">
                  Ordem Crescente
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualização comparativa */}
      {atendentesSelecionados.length > 1 &&
        configuracao.metricasPrincipais.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Comparação Visual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {configuracao.tipoVisualizacao !== 'tabela' ? (
                renderizarGrafico()
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left">
                          Atendente
                        </th>
                        {configuracao.metricasPrincipais.map(metrica => {
                          const metricaInfo = METRICAS_DISPONIVEIS.find(
                            m => m.key === metrica
                          );
                          return (
                            <th
                              key={metrica}
                              className="border border-gray-200 p-3 text-center"
                            >
                              <div className="flex items-center justify-center space-x-1">
                                {metricaInfo?.icone}
                                <span>{metricaInfo?.nome}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {atendentesSelecionados.map(atendente => (
                        <tr key={atendente.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {atendente.nome.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {atendente.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {atendente.cargo}
                                </div>
                              </div>
                            </div>
                          </td>
                          {configuracao.metricasPrincipais.map(metrica => {
                            const valor = obterValorMetrica(atendente, metrica);
                            const metricaInfo = METRICAS_DISPONIVEIS.find(
                              m => m.key === metrica
                            );
                            return (
                              <td
                                key={metrica}
                                className="border border-gray-200 p-3 text-center"
                              >
                                <span className="font-medium">
                                  {formatarValor(
                                    valor,
                                    metricaInfo?.tipo || 'numero'
                                  )}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Estado vazio */}
      {atendentesSelecionados.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum atendente selecionado
            </h3>
            <p className="text-gray-500 mb-4">
              Use a busca acima para encontrar e selecionar atendentes para
              comparação
            </p>
            <p className="text-sm text-gray-400">
              Você pode comparar até 6 atendentes simultaneamente
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ComparativoAtendentes;
