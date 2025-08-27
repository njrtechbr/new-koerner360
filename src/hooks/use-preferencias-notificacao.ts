import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  PreferenciasNotificacao, 
  PreferenciasNotificacaoInput 
} from '@/lib/types/preferencias-notificacao';

interface UsePreferenciasNotificacaoReturn {
  // Estado
  preferencias: PreferenciasNotificacao | null;
  carregando: boolean;
  erro: string | null;
  
  // Ações
  buscarPreferencias: () => Promise<void>;
  atualizarPreferencias: (dados: PreferenciasNotificacaoInput) => Promise<boolean>;
  resetarPreferencias: () => Promise<boolean>;
  pausarNotificacoes: (dataFim: Date, dataInicio?: Date, motivo?: string) => Promise<boolean>;
  retomarNotificacoes: () => Promise<boolean>;
  verificarNotificacoesPausadas: () => Promise<boolean>;
}

export function usePreferenciasNotificacao(): UsePreferenciasNotificacaoReturn {
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacao | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Busca as preferências do usuário
   */
  const buscarPreferencias = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/preferencias-notificacao');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar preferências');
      }

      setPreferencias(data.data);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagem);
      toast({
        title: 'Erro',
        description: `Falha ao carregar preferências: ${mensagem}`,
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  /**
   * Atualiza as preferências do usuário
   */
  const atualizarPreferencias = useCallback(async (
    dados: PreferenciasNotificacaoInput
  ): Promise<boolean> => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/preferencias-notificacao', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar preferências');
      }

      setPreferencias(data.data);
      toast({
        title: 'Sucesso',
        description: data.message || 'Preferências atualizadas com sucesso',
      });

      return true;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagem);
      toast({
        title: 'Erro',
        description: `Falha ao atualizar preferências: ${mensagem}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  /**
   * Reseta as preferências para os valores padrão
   */
  const resetarPreferencias = useCallback(async (): Promise<boolean> => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/preferencias-notificacao', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar preferências');
      }

      setPreferencias(data.data);
      toast({
        title: 'Sucesso',
        description: data.message || 'Preferências resetadas com sucesso',
      });

      return true;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagem);
      toast({
        title: 'Erro',
        description: `Falha ao resetar preferências: ${mensagem}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  /**
   * Pausa as notificações por um período
   */
  const pausarNotificacoes = useCallback(async (
    dataFim: Date,
    dataInicio?: Date,
    motivo?: string
  ): Promise<boolean> => {
    setCarregando(true);
    setErro(null);

    try {
      const body: any = {
        dataFim: dataFim.toISOString(),
      };

      if (dataInicio) {
        body.dataInicio = dataInicio.toISOString();
      }

      if (motivo) {
        body.motivo = motivo;
      }

      const response = await fetch('/api/preferencias-notificacao/pausar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao pausar notificações');
      }

      setPreferencias(data.data);
      toast({
        title: 'Sucesso',
        description: data.message || 'Notificações pausadas com sucesso',
      });

      return true;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagem);
      toast({
        title: 'Erro',
        description: `Falha ao pausar notificações: ${mensagem}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  /**
   * Retoma as notificações (remove pausa)
   */
  const retomarNotificacoes = useCallback(async (): Promise<boolean> => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/preferencias-notificacao/pausar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao retomar notificações');
      }

      setPreferencias(data.data);
      toast({
        title: 'Sucesso',
        description: data.message || 'Notificações retomadas com sucesso',
      });

      return true;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagem);
      toast({
        title: 'Erro',
        description: `Falha ao retomar notificações: ${mensagem}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  /**
   * Verifica se as notificações estão pausadas
   */
  const verificarNotificacoesPausadas = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/preferencias-notificacao/pausar');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status');
      }

      return data.data.pausadas;
    } catch (error) {
      console.error('Erro ao verificar notificações pausadas:', error);
      return false;
    }
  }, []);

  // Carrega preferências ao montar o componente
  useEffect(() => {
    buscarPreferencias();
  }, [buscarPreferencias]);

  return {
    // Estado
    preferencias,
    carregando,
    erro,
    
    // Ações
    buscarPreferencias,
    atualizarPreferencias,
    resetarPreferencias,
    pausarNotificacoes,
    retomarNotificacoes,
    verificarNotificacoesPausadas,
  };
}