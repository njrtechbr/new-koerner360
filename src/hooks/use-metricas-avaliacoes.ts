import { useState, useEffect, useCallback } from 'react';
import { 
  MetricasAtendente, 
  MetricasPeriodo, 
  ComparativoTemporal, 
  FiltrosMetricas 
} from '@/lib/utils/metricas-avaliacoes';

// Tipos para os dados da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: any;
}

interface MetricasConsolidadas {
  metricasGerais: MetricasPeriodo;
  metricasPorAtendente: MetricasAtendente[];
  ranking: MetricasAtendente[];
}

interface UseMetricasAvaliacoesReturn {
  // Estados
  metricas: MetricasConsolidadas | null;
  ranking: MetricasAtendente[];
  comparativo: ComparativoTemporal | null;
  loading: boolean;
  error: string | null;
  
  // Funções
  buscarMetricas: (filtros?: FiltrosMetricas) => Promise<void>;
  buscarRanking: (filtros?: FiltrosMetricas, limite?: number) => Promise<void>;
  gerarComparativo: (periodos: any[], filtros?: FiltrosMetricas) => Promise<void>;
  limparErro: () => void;
  recarregar: () => Promise<void>;
}

/**
 * Hook personalizado para gerenciar métricas de avaliações
 * Fornece funcionalidades para buscar métricas consolidadas, ranking e comparativos
 */
export function useMetricasAvaliacoes(filtrosIniciais?: FiltrosMetricas): UseMetricasAvaliacoesReturn {
  // Estados
  const [metricas, setMetricas] = useState<MetricasConsolidadas | null>(null);
  const [ranking, setRanking] = useState<MetricasAtendente[]>([]);
  const [comparativo, setComparativo] = useState<ComparativoTemporal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtrosAtuais, setFiltrosAtuais] = useState<FiltrosMetricas | undefined>(filtrosIniciais);

  /**
   * Função auxiliar para fazer requisições à API
   */
  const fazerRequisicao = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Erro na resposta da API');
    }

    return data.data;
  }, []);

  /**
   * Buscar métricas consolidadas
   */
  const buscarMetricas = useCallback(async (filtros?: FiltrosMetricas) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosParaUsar = filtros || filtrosAtuais;
      setFiltrosAtuais(filtrosParaUsar);

      const dados = await fazerRequisicao<MetricasConsolidadas>(
        '/api/avaliacoes/metricas/consolidadas',
        {
          method: 'POST',
          body: JSON.stringify({ filtros: filtrosParaUsar }),
        }
      );

      setMetricas(dados);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao buscar métricas: ${mensagem}`);
      console.error('Erro ao buscar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, [filtrosAtuais, fazerRequisicao]);

  /**
   * Buscar ranking de atendentes
   */
  const buscarRanking = useCallback(async (filtros?: FiltrosMetricas, limite = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosParaUsar = filtros || filtrosAtuais;

      const dados = await fazerRequisicao<MetricasAtendente[]>(
        '/api/avaliacoes/metricas/ranking',
        {
          method: 'POST',
          body: JSON.stringify({ 
            filtros: filtrosParaUsar,
            limite 
          }),
        }
      );

      setRanking(dados);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao buscar ranking: ${mensagem}`);
      console.error('Erro ao buscar ranking:', err);
    } finally {
      setLoading(false);
    }
  }, [filtrosAtuais, fazerRequisicao]);

  /**
   * Gerar comparativo temporal
   */
  const gerarComparativo = useCallback(async (
    periodos: any[], 
    filtros?: FiltrosMetricas
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosParaUsar = filtros || filtrosAtuais;

      if (periodos.length < 2) {
        throw new Error('É necessário pelo menos 2 períodos para comparação');
      }

      const dados = await fazerRequisicao<ComparativoTemporal>(
        '/api/avaliacoes/metricas/comparativo',
        {
          method: 'POST',
          body: JSON.stringify({ 
            filtros: filtrosParaUsar,
            periodos 
          }),
        }
      );

      setComparativo(dados);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao gerar comparativo: ${mensagem}`);
      console.error('Erro ao gerar comparativo:', err);
    } finally {
      setLoading(false);
    }
  }, [filtrosAtuais, fazerRequisicao]);

  /**
   * Limpar erro
   */
  const limparErro = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Recarregar dados atuais
   */
  const recarregar = useCallback(async () => {
    if (filtrosAtuais) {
      await buscarMetricas(filtrosAtuais);
    }
  }, [buscarMetricas, filtrosAtuais]);

  // Carregar métricas iniciais se filtros foram fornecidos
  useEffect(() => {
    if (filtrosIniciais) {
      buscarMetricas(filtrosIniciais);
    }
  }, []); // Executar apenas uma vez na montagem

  return {
    // Estados
    metricas,
    ranking,
    comparativo,
    loading,
    error,
    
    // Funções
    buscarMetricas,
    buscarRanking,
    gerarComparativo,
    limparErro,
    recarregar,
  };
}

/**
 * Hook simplificado para buscar apenas o ranking
 */
export function useRankingAtendentes(limite = 10, filtros?: FiltrosMetricas) {
  const [ranking, setRanking] = useState<MetricasAtendente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/avaliacoes/metricas/ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filtros, limite }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data: ApiResponse<MetricasAtendente[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      setRanking(data.data);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(mensagem);
      console.error('Erro ao buscar ranking:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, limite]);

  useEffect(() => {
    buscarRanking();
  }, [buscarRanking]);

  return {
    ranking,
    loading,
    error,
    recarregar: buscarRanking,
  };
}