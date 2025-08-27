'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AvaliacaoPendente,
  EstatisticasNotificacoes,
  NotificacaoConfig,
  buscarAvaliacoesPendentesUsuario,
  gerarEstatisticasNotificacoes,
  buscarConfiguracaoNotificacao,
  deveReceberNotificacao
} from '@/lib/utils/notificacoes-avaliacoes';

interface UseNotificacoesAvaliacoesProps {
  usuarioId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em milissegundos
}

interface UseNotificacoesAvaliacoesReturn {
  avaliacoesPendentes: AvaliacaoPendente[];
  estatisticas: EstatisticasNotificacoes | null;
  configuracao: NotificacaoConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  marcarComoLida: (avaliacaoId: string) => void;
  atualizarConfiguracao: (novaConfig: Partial<NotificacaoConfig>) => Promise<void>;
}

export function useNotificacoesAvaliacoes({
  usuarioId,
  autoRefresh = false,
  refreshInterval = 60000 // 1 minuto
}: UseNotificacoesAvaliacoesProps): UseNotificacoesAvaliacoesReturn {
  const [avaliacoesPendentes, setAvaliacoesPendentes] = useState<AvaliacaoPendente[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasNotificacoes | null>(null);
  const [configuracao, setConfiguracao] = useState<NotificacaoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar avaliações pendentes
      const avaliacoes = await buscarAvaliacoesPendentesUsuario(usuarioId);
      setAvaliacoesPendentes(avaliacoes);

      // Gerar estatísticas
      const stats = await gerarEstatisticasNotificacoes(usuarioId);
      setEstatisticas(stats);

      // Buscar configuração
      const config = await buscarConfiguracaoNotificacao(usuarioId);
      setConfiguracao(config);

    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  const marcarComoLida = useCallback((avaliacaoId: string) => {
    // Por enquanto, apenas remove da lista local
    // Em uma implementação real, isso seria persistido no backend
    setAvaliacoesPendentes(prev => 
      prev.filter(avaliacao => avaliacao.id !== avaliacaoId)
    );

    // Atualizar estatísticas
    if (estatisticas) {
      setEstatisticas(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalPendentes: prev.totalPendentes - 1
        };
      });
    }
  }, [estatisticas]);

  const atualizarConfiguracao = useCallback(async (novaConfig: Partial<NotificacaoConfig>) => {
    try {
      // Em uma implementação real, isso seria uma chamada para a API
      if (configuracao) {
        const configAtualizada = { ...configuracao, ...novaConfig };
        setConfiguracao(configAtualizada);
      }
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
    }
  }, [configuracao]);

  return {
    avaliacoesPendentes,
    estatisticas,
    configuracao,
    loading,
    error,
    refetch: fetchData,
    marcarComoLida,
    atualizarConfiguracao
  };
}

// Hook simplificado para apenas verificar se há notificações
export function useTemNotificacoesPendentes(usuarioId: string): {
  temNotificacoes: boolean;
  quantidadeTotal: number;
  quantidadeCriticas: number;
  loading: boolean;
} {
  const [temNotificacoes, setTemNotificacoes] = useState(false);
  const [quantidadeTotal, setQuantidadeTotal] = useState(0);
  const [quantidadeCriticas, setQuantidadeCriticas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarNotificacoes = async () => {
      try {
        setLoading(true);
        const avaliacoes = await buscarAvaliacoesPendentesUsuario(usuarioId);
        const stats = await gerarEstatisticasNotificacoes(usuarioId);
        
        setTemNotificacoes(avaliacoes.length > 0);
        setQuantidadeTotal(stats.totalPendentes);
        setQuantidadeCriticas(stats.criticas);
      } catch (err) {
        console.error('Erro ao verificar notificações:', err);
      } finally {
        setLoading(false);
      }
    };

    verificarNotificacoes();
  }, [usuarioId]);

  return {
    temNotificacoes,
    quantidadeTotal,
    quantidadeCriticas,
    loading
  };
}

// Hook para configurações de notificação
export function useConfiguracaoNotificacoes(usuarioId: string) {
  const [configuracao, setConfiguracao] = useState<NotificacaoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarConfiguracao = async () => {
      try {
        setLoading(true);
        const config = await buscarConfiguracaoNotificacao(usuarioId);
        setConfiguracao(config);
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    carregarConfiguracao();
  }, [usuarioId]);

  const salvarConfiguracao = useCallback(async (novaConfig: Partial<NotificacaoConfig>) => {
    try {
      // Em uma implementação real, isso seria uma chamada para a API
      if (configuracao) {
        const configAtualizada = { ...configuracao, ...novaConfig };
        setConfiguracao(configAtualizada);
        return configAtualizada;
      }
      return null;
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
      return null;
    }
  }, [configuracao]);

  const verificarPermissaoNotificacao = useCallback(async (tipo: 'email' | 'interface') => {
    return await deveReceberNotificacao(usuarioId, tipo);
  }, [usuarioId]);

  return {
    configuracao,
    loading,
    error,
    salvarConfiguracao,
    verificarPermissaoNotificacao
  };
}