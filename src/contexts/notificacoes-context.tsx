'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotificacoesAvaliacoes } from '@/hooks/use-notificacoes-avaliacoes';
import type { AvaliacaoPendente } from '@/lib/utils/notificacoes-avaliacoes';

interface NotificacoesContextData {
  notificacoesPendentes: AvaliacaoPendente[];
  carregandoNotificacoes: boolean;
  marcarComoLida: (notificacaoId: string) => Promise<void>;
  atualizarNotificacoes: () => Promise<void>;
  exibirNotificacaoToast: (notificacao: AvaliacaoPendente) => void;
  configurarNotificacoesAutomaticas: (intervaloMinutos?: number) => void;
  pararNotificacoesAutomaticas: () => void;
}

const NotificacoesContext = createContext<NotificacoesContextData | undefined>(undefined);

interface NotificacoesProviderProps {
  children: React.ReactNode;
  usuarioId?: string;
  diasAntecedencia?: number;
  intervaloVerificacao?: number; // em minutos
}

export function NotificacoesProvider({
  children,
  usuarioId,
  diasAntecedencia = 7,
  intervaloVerificacao = 30,
}: NotificacoesProviderProps) {
  const { toast } = useToast();
  const {
    avaliacoesPendentes,
    carregando,
    buscarAvaliacoesPendentes,
    marcarNotificacaoLida,
  } = useNotificacoesAvaliacoes();

  const [intervalId, setIntervalId] = React.useState<NodeJS.Timeout | null>(null);
  const [notificacoesExibidas, setNotificacoesExibidas] = React.useState<Set<string>>(new Set());

  // Função para exibir notificação toast
  const exibirNotificacaoToast = useCallback((notificacao: AvaliacaoPendente) => {
    const urgenciaColors = {
      baixa: 'info' as const,
      media: 'warning' as const,
      alta: 'destructive' as const,
    };

    const urgenciaLabels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
    };

    toast({
      variant: urgenciaColors[notificacao.urgencia],
      title: `Avaliação Pendente - Urgência ${urgenciaLabels[notificacao.urgencia]}`,
      description: `${notificacao.avaliado.nome} - ${notificacao.tipo} (Prazo: ${new Date(notificacao.prazoFinal).toLocaleDateString('pt-BR')})`,
      action: (
        <button
          onClick={() => {
            // Navegar para a avaliação
            window.location.href = `/avaliacoes/${notificacao.avaliacaoId}`;
          }}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Ver Avaliação
        </button>
      ),
    });
  }, [toast]);

  // Função para marcar notificação como lida
  const marcarComoLida = useCallback(async (notificacaoId: string) => {
    try {
      await marcarNotificacaoLida(notificacaoId);
      setNotificacoesExibidas(prev => new Set([...prev, notificacaoId]));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível marcar a notificação como lida.',
      });
    }
  }, [marcarNotificacaoLida, toast]);

  // Função para atualizar notificações
  const atualizarNotificacoes = useCallback(async () => {
    if (!usuarioId) return;
    
    try {
      await buscarAvaliacoesPendentes({
        usuarioId,
        diasAntecedencia,
        incluirEstatisticas: false,
      });
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    }
  }, [usuarioId, diasAntecedencia, buscarAvaliacoesPendentes]);

  // Função para verificar novas notificações e exibir toasts
  const verificarNovasNotificacoes = useCallback(() => {
    if (!avaliacoesPendentes.length) return;

    avaliacoesPendentes.forEach(notificacao => {
      // Só exibe toast para notificações não exibidas e de alta urgência
      if (!notificacoesExibidas.has(notificacao.id) && notificacao.urgencia === 'alta') {
        exibirNotificacaoToast(notificacao);
        setNotificacoesExibidas(prev => new Set([...prev, notificacao.id]));
      }
    });
  }, [avaliacoesPendentes, notificacoesExibidas, exibirNotificacaoToast]);

  // Configurar notificações automáticas
  const configurarNotificacoesAutomaticas = useCallback((intervaloMinutos = intervaloVerificacao) => {
    // Limpar intervalo anterior se existir
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Configurar novo intervalo
    const novoIntervalId = setInterval(() => {
      atualizarNotificacoes();
    }, intervaloMinutos * 60 * 1000);

    setIntervalId(novoIntervalId);
  }, [intervalId, intervaloVerificacao, atualizarNotificacoes]);

  // Parar notificações automáticas
  const pararNotificacoesAutomaticas = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [intervalId]);

  // Efeito para carregar notificações iniciais
  useEffect(() => {
    if (usuarioId) {
      atualizarNotificacoes();
    }
  }, [usuarioId, atualizarNotificacoes]);

  // Efeito para verificar novas notificações
  useEffect(() => {
    verificarNovasNotificacoes();
  }, [verificarNovasNotificacoes]);

  // Efeito para configurar notificações automáticas
  useEffect(() => {
    if (usuarioId) {
      configurarNotificacoesAutomaticas();
    }

    return () => {
      pararNotificacoesAutomaticas();
    };
  }, [usuarioId, configurarNotificacoesAutomaticas, pararNotificacoesAutomaticas]);

  const contextValue: NotificacoesContextData = {
    notificacoesPendentes: avaliacoesPendentes,
    carregandoNotificacoes: carregando,
    marcarComoLida,
    atualizarNotificacoes,
    exibirNotificacaoToast,
    configurarNotificacoesAutomaticas,
    pararNotificacoesAutomaticas,
  };

  return (
    <NotificacoesContext.Provider value={contextValue}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (context === undefined) {
    throw new Error('useNotificacoes deve ser usado dentro de um NotificacoesProvider');
  }
  return context;
}