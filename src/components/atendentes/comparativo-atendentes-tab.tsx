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
  BarChart3,
  TrendingUp,
  Users,
  Star,
  FileText,
  Plus,
  X,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  ComparativoAtendentes,
  FiltrosPeriodo,
  ExportarRelatorios,
  StatusTempoReal,
} from '@/components/metricas';
import { useMetricasAtendenteTempoReal } from '@/hooks/use-metricas-tempo-real';
import { cn } from '@/lib/utils';

/**
 * Interface para atendente selecionado
 */
interface AtendenteSelecionado {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  status: string;
  cor?: string;
}

/**
 * Interface para configuração do comparativo
 */
interface ConfiguracaoComparativo {
  atendentes: AtendenteSelecionado[];
  metricas: string[];
  periodo: string;
  tipoVisualizacao: 'tabela' | 'grafico' | 'ambos';
  mostrarTendencias: boolean;
  agruparPor?: 'setor' | 'cargo' | 'status';
}

/**
 * Métricas disponíveis para comparação
 */
const METRICAS_DISPONIVEIS = [
  { id: 'avaliacaoMedia', nome: 'Avaliação Média', tipo: 'nota' },
  { id: 'documentosCriados', nome: 'Documentos Criados', tipo: 'numero' },
  { id: 'produtividade', nome: 'Produtividade', tipo: 'percentual' },
  { id: 'pontualidade', nome: 'Pontualidade', tipo: 'percentual' },
  { id: 'qualidade', nome: 'Qualidade', tipo: 'percentual' },
  { id: 'satisfacaoCliente', nome: 'Satisfação do Cliente', tipo: 'nota' },
  {
    id: 'tempoMedioAtendimento',
    nome: 'Tempo Médio de Atendimento',
    tipo: 'tempo',
  },
  { id: 'alteracoesRealizadas', nome: 'Alterações Realizadas', tipo: 'numero' },
];

/**
 * Cores para diferenciação dos atendentes
 */
const CORES_ATENDENTES = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

/**
 * Componente da aba de comparativo de atendentes
 */
export function ComparativoAtendentesTab() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoComparativo>({
    atendentes: [],
    metricas: ['avaliacaoMedia', 'produtividade', 'documentosCriados'],
    periodo: '30dias',
    tipoVisualizacao: 'ambos',
    mostrarTendencias: true,
  });

  const [buscarAtendente, setBuscarAtendente] = useState('');
  const [atendentesSugeridos, setAtendentesSugeridos] = useState<
    AtendenteSelecionado[]
  >([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Hook para dados comparativos
  const {
    dados: dadosComparativo,
    carregando,
    status,
    forcarAtualizacao,
  } = useMetricasAtendenteTempoReal({
    endpoint: '/api/atendentes/comparativo',
    parametros: {
      atendentes: configuracao.atendentes.map(a => a.id),
      metricas: configuracao.metricas,
      periodo: configuracao.periodo,
    },
    intervalo: 60000, // 1 minuto
    ativo: configuracao.atendentes.length > 0,
  });

  // Função para buscar atendentes
  const buscarAtendentes = async (termo: string) => {
    if (termo.length < 2) {
      setAtendentesSugeridos([]);
      return;
    }

    setCarregandoSugestoes(true);
    try {
      const response = await fetch(
        `/api/atendentes/buscar?q=${encodeURIComponent(termo)}`
      );
      const atendentes = await response.json();

      // Filtrar atendentes já selecionados
      const atendentesFiltrados = atendentes.filter(
        (atendente: any) =>
          !configuracao.atendentes.some(a => a.id === atendente.id)
      );

      setAtendentesSugeridos(atendentesFiltrados);
    } catch (error) {
      console.error('Erro ao buscar atendentes:', error);
    } finally {
      setCarregandoSugestoes(false);
    }
  };

  // Função para adicionar atendente
  const adicionarAtendente = (atendente: AtendenteSelecionado) => {
    if (configuracao.atendentes.length >= 8) {
      alert('Máximo de 8 atendentes para comparação');
      return;
    }

    const cor = CORES_ATENDENTES[configuracao.atendentes.length];
    const novoAtendente = { ...atendente, cor };

    setConfiguracao(prev => ({
      ...prev,
      atendentes: [...prev.atendentes, novoAtendente],
    }));

    setBuscarAtendente('');
    setAtendentesSugeridos([]);
  };

  // Função para remover atendente
  const removerAtendente = (id: string) => {
    setConfiguracao(prev => ({
      ...prev,
      atendentes: prev.atendentes.filter(a => a.id !== id),
    }));
  };

  // Função para atualizar métricas selecionadas
  const toggleMetrica = (metricaId: string) => {
    setConfiguracao(prev => ({
      ...prev,
      metricas: prev.metricas.includes(metricaId)
        ? prev.metricas.filter(m => m !== metricaId)
        : [...prev.metricas, metricaId],
    }));
  };

  // Função para exportar comparativo
  const handleExportar = async (configExportacao: any) => {
    setExportando(true);
    try {
      // Implementar lógica de exportação
      console.log('Exportando comparativo:', configExportacao);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Comparativo de Atendentes
          </h2>
          <p className="text-muted-foreground">
            Compare o desempenho de diferentes atendentes lado a lado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusTempoReal
            status={status}
            carregando={carregando}
            onForcarAtualizacao={forcarAtualizacao}
            compacto
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Configurações */}
      <Card className={cn(!mostrarFiltros && 'hidden')}>
        <CardHeader>
          <CardTitle>Configurações do Comparativo</CardTitle>
          <CardDescription>
            Configure os parâmetros para comparação entre atendentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros de Período */}
          <div>
            <Label className="text-base font-semibold">Período</Label>
            <FiltrosPeriodo
              filtros={{ periodo: configuracao.periodo }}
              onFiltrosChange={filtros =>
                setConfiguracao(prev => ({
                  ...prev,
                  periodo: filtros.periodo || '30dias',
                }))
              }
              compacto
            />
          </div>

          {/* Tipo de Visualização */}
          <div>
            <Label className="text-base font-semibold">
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
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tabela">Apenas Tabela</SelectItem>
                <SelectItem value="grafico">Apenas Gráfico</SelectItem>
                <SelectItem value="ambos">Tabela e Gráfico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opções Adicionais */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Opções</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tendencias"
                checked={configuracao.mostrarTendencias}
                onCheckedChange={checked =>
                  setConfiguracao(prev => ({
                    ...prev,
                    mostrarTendencias: !!checked,
                  }))
                }
              />
              <Label htmlFor="tendencias">Mostrar tendências</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Atendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Atendentes para Comparação
          </CardTitle>
          <CardDescription>
            Selecione até 8 atendentes para comparar (mínimo 2)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca de Atendentes */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atendente por nome..."
              value={buscarAtendente}
              onChange={e => {
                setBuscarAtendente(e.target.value);
                buscarAtendentes(e.target.value);
              }}
              className="pl-10"
            />
            {carregandoSugestoes && (
              <RefreshCw className="absolute right-3 top-3 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Sugestões */}
          {atendentesSugeridos.length > 0 && (
            <div className="border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
              {atendentesSugeridos.map(atendente => (
                <button
                  key={atendente.id}
                  onClick={() => adicionarAtendente(atendente)}
                  className="w-full text-left p-2 rounded hover:bg-muted flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{atendente.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {atendente.cargo} • {atendente.setor}
                    </div>
                  </div>
                  <Plus className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          {/* Atendentes Selecionados */}
          {configuracao.atendentes.length > 0 && (
            <div>
              <Label className="text-sm font-medium">
                Atendentes Selecionados
              </Label>
              <div className="mt-2 space-y-2">
                {configuracao.atendentes.map(atendente => (
                  <div
                    key={atendente.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: atendente.cor }}
                      />
                      <div>
                        <div className="font-medium">{atendente.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {atendente.cargo} • {atendente.setor}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerAtendente(atendente.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seleção de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas para Comparação
          </CardTitle>
          <CardDescription>
            Selecione as métricas que deseja comparar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {METRICAS_DISPONIVEIS.map(metrica => (
              <div key={metrica.id} className="flex items-center space-x-2">
                <Checkbox
                  id={metrica.id}
                  checked={configuracao.metricas.includes(metrica.id)}
                  onCheckedChange={() => toggleMetrica(metrica.id)}
                />
                <Label htmlFor={metrica.id} className="text-sm">
                  {metrica.nome}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      {configuracao.atendentes.length >= 2 &&
        configuracao.metricas.length > 0 && (
          <ComparativoAtendentes
            atendentes={configuracao.atendentes}
            metricas={configuracao.metricas}
            dados={dadosComparativo}
            periodo={configuracao.periodo}
            tipoVisualizacao={configuracao.tipoVisualizacao}
            mostrarTendencias={configuracao.mostrarTendencias}
            carregando={carregando}
          />
        )}

      {/* Mensagem quando não há dados suficientes */}
      {configuracao.atendentes.length < 2 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Selecione Atendentes para Comparar
            </h3>
            <p className="text-muted-foreground">
              Adicione pelo menos 2 atendentes para visualizar o comparativo
            </p>
          </CardContent>
        </Card>
      )}

      {/* Exportação */}
      {configuracao.atendentes.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Comparativo
            </CardTitle>
            <CardDescription>
              Exporte os dados do comparativo em diferentes formatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportarRelatorios
              dados={{
                filtros: { periodo: configuracao.periodo },
                metricas: dadosComparativo,
                atendentes: configuracao.atendentes,
                configuracao,
              }}
              onExportar={handleExportar}
              carregando={exportando}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
