'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Interface para configuração de atualização em tempo real
 */
export interface ConfiguracaoTempoReal {
  intervalo?: number; // em milissegundos
  ativo?: boolean;
  endpoint: string;
  parametros?: Record<string, any>;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
  onUpdate?: (data: any) => void;
}

/**
 * Interface para status da conexão
 */
export interface StatusConexao {
  conectado: boolean;
  ultimaAtualizacao?: Date;
  tentativasReconexao: number;
  erro?: string;
}

/**
 * Hook para atualização em tempo real de métricas
 */
export function useMetricasTempoReal<T = any>(
  configuracao: ConfiguracaoTempoReal
) {
  const {
    intervalo = 30000, // 30 segundos por padrão
    ativo = true,
    endpoint,
    parametros = {},
    onError,
    onSuccess,
    onUpdate,
  } = configuracao;

  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState<StatusConexao>({
    conectado: false,
    tentativasReconexao: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dadosAnterioresRef = useRef<T | null>(null);

  // Função para buscar dados
  const buscarDados = useCallback(async () => {
    if (!ativo || !endpoint) return;

    try {
      // Cancelar requisição anterior se ainda estiver pendente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setCarregando(true);

      // Construir URL com parâmetros
      const url = new URL(endpoint, window.location.origin);
      Object.entries(parametros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Erro HTTP: ${response.status} - ${response.statusText}`
        );
      }

      const novosDados = await response.json();

      // Verificar se os dados mudaram
      const dadosAlteraram =
        JSON.stringify(dadosAnterioresRef.current) !==
        JSON.stringify(novosDados);

      setDados(novosDados);
      dadosAnterioresRef.current = novosDados;

      setStatus(prev => ({
        ...prev,
        conectado: true,
        ultimaAtualizacao: new Date(),
        tentativasReconexao: 0,
        erro: undefined,
      }));

      // Chamar callbacks
      onSuccess?.(novosDados);

      if (dadosAlteraram && dadosAnterioresRef.current !== null) {
        onUpdate?.(novosDados);

        // Mostrar notificação de atualização
        toast.info('Métricas atualizadas', {
          description: 'Os dados foram atualizados automaticamente',
          duration: 3000,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Requisição foi cancelada, não é um erro
      }

      console.error('Erro ao buscar métricas:', error);

      setStatus(prev => ({
        ...prev,
        conectado: false,
        tentativasReconexao: prev.tentativasReconexao + 1,
        erro: error.message,
      }));

      onError?.(error);

      // Mostrar toast de erro apenas se não for muitas tentativas
      if (status.tentativasReconexao < 3) {
        toast.error('Erro ao atualizar métricas', {
          description: error.message,
          duration: 5000,
        });
      }
    } finally {
      setCarregando(false);
    }
  }, [
    ativo,
    endpoint,
    parametros,
    onError,
    onSuccess,
    onUpdate,
    status.tentativasReconexao,
  ]);

  // Função para iniciar polling
  const iniciarPolling = useCallback(() => {
    if (!ativo || intervalRef.current) return;

    // Buscar dados imediatamente
    buscarDados();

    // Configurar intervalo
    intervalRef.current = setInterval(buscarDados, intervalo);
  }, [ativo, buscarDados, intervalo]);

  // Função para parar polling
  const pararPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setStatus(prev => ({
      ...prev,
      conectado: false,
    }));
  }, []);

  // Função para forçar atualização
  const forcarAtualizacao = useCallback(() => {
    buscarDados();
  }, [buscarDados]);

  // Função para reconectar
  const reconectar = useCallback(() => {
    pararPolling();
    setStatus(prev => ({
      ...prev,
      tentativasReconexao: 0,
      erro: undefined,
    }));

    setTimeout(() => {
      iniciarPolling();
    }, 1000);
  }, [pararPolling, iniciarPolling]);

  // Effect para gerenciar o ciclo de vida do polling
  useEffect(() => {
    if (ativo) {
      iniciarPolling();
    } else {
      pararPolling();
    }

    return () => {
      pararPolling();
    };
  }, [ativo, iniciarPolling, pararPolling]);

  // Effect para detectar mudanças nos parâmetros
  useEffect(() => {
    if (ativo && intervalRef.current) {
      // Reiniciar polling com novos parâmetros
      pararPolling();
      iniciarPolling();
    }
  }, [parametros, ativo, pararPolling, iniciarPolling]);

  // Effect para limpeza na desmontagem
  useEffect(() => {
    return () => {
      pararPolling();
    };
  }, [pararPolling]);

  // Effect para gerenciar reconexão automática
  useEffect(() => {
    if (
      !status.conectado &&
      status.tentativasReconexao > 0 &&
      status.tentativasReconexao < 5 &&
      ativo
    ) {
      const timeout = setTimeout(
        () => {
          reconectar();
        },
        Math.min(1000 * Math.pow(2, status.tentativasReconexao), 30000)
      ); // Backoff exponencial

      return () => clearTimeout(timeout);
    }
  }, [status.conectado, status.tentativasReconexao, ativo, reconectar]);

  return {
    dados,
    carregando,
    status,
    forcarAtualizacao,
    reconectar,
    pararPolling,
    iniciarPolling,
  };
}

/**
 * Hook específico para métricas de atendente individual
 */
export function useMetricasAtendenteTempoReal(
  atendenteId: string,
  filtros?: Record<string, any>
) {
  return useMetricasTempoReal({
    endpoint: `/api/atendentes/${atendenteId}/metricas`,
    parametros: filtros,
    intervalo: 30000, // 30 segundos
    onUpdate: dados => {
      console.log('Métricas do atendente atualizadas:', dados);
    },
  });
}

/**
 * Hook específico para dashboard geral
 */
export function useMetricasDashboardTempoReal(filtros?: Record<string, any>) {
  return useMetricasTempoReal({
    endpoint: '/api/atendentes/dashboard',
    parametros: filtros,
    intervalo: 60000, // 1 minuto
    onUpdate: dados => {
      console.log('Dashboard atualizado:', dados);
    },
  });
}

/**
 * Hook para múltiplas métricas em tempo real
 */
export function useMultiplasMetricasTempoReal(
  configuracoes: ConfiguracaoTempoReal[]
) {
  const resultados = configuracoes.map(config => useMetricasTempoReal(config));

  const carregandoGeral = resultados.some(r => r.carregando);
  const conectadoGeral = resultados.every(r => r.status.conectado);
  const errosGerais = resultados
    .filter(r => r.status.erro)
    .map(r => r.status.erro)
    .filter(Boolean);

  const forcarAtualizacaoTodas = useCallback(() => {
    resultados.forEach(r => r.forcarAtualizacao());
  }, [resultados]);

  const reconectarTodas = useCallback(() => {
    resultados.forEach(r => r.reconectar());
  }, [resultados]);

  return {
    resultados,
    carregandoGeral,
    conectadoGeral,
    errosGerais,
    forcarAtualizacaoTodas,
    reconectarTodas,
  };
}

export default useMetricasTempoReal;
