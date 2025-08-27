import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Lembrete {
  id: string;
  avaliacaoId: string;
  usuarioId: string;
  tipo: 'lembrete' | 'vencimento';
  dataEnvio: string;
  enviado: boolean;
  tentativas: number;
  ultimaTentativa?: string;
  dataEnvioReal?: string;
  erro?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm?: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    cargo?: string;
  };
  avaliacao: {
    id: string;
    prazo: string;
    status: string;
    avaliado: {
      id: string;
      nome: string;
      cargo?: string;
      email: string;
    };
    avaliador: {
      id: string;
      nome: string;
      email: string;
    };
    periodo: {
      id: string;
      nome: string;
      dataInicio: string;
      dataFim: string;
    };
  };
  criadoPorUsuario?: {
    id: string;
    nome: string;
  };
}

interface ConfiguracaoAgendador {
  diasAntecedencia: number[];
  horarioEnvio: string;
  ativo: boolean;
  incluirFimDeSemana: boolean;
  incluirFeriados: boolean;
}

interface StatusAgendador {
  ativo: boolean;
  configuracao: ConfiguracaoAgendador;
  estatisticas: {
    totalAgendados: number;
    totalEnviados: number;
    totalPendentes: number;
    totalFalhas: number;
    proximosEnvios: Lembrete[];
    ultimosEnviados: Lembrete[];
  };
}

interface FiltrosLembretes {
  usuarioId?: string;
  avaliacaoId?: string;
  tipo?: 'lembrete' | 'vencimento';
  enviado?: boolean;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
  pagina?: number;
}

interface PaginacaoLembretes {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  temProximaPagina: boolean;
  temPaginaAnterior: boolean;
}

interface ResultadoLembretes {
  lembretes: Lembrete[];
  paginacao: PaginacaoLembretes;
  carregando: boolean;
  erro: string | null;
}

export function useLembretes(filtros: FiltrosLembretes = {}) {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoLembretes>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalItens: 0,
    itensPorPagina: 50,
    temProximaPagina: false,
    temPaginaAnterior: false,
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Busca lembretes com filtros
   */
  const buscarLembretes = useCallback(async (novosFiltros: FiltrosLembretes = {}) => {
    setCarregando(true);
    setErro(null);

    try {
      const filtrosCompletos = { ...filtros, ...novosFiltros };
      const params = new URLSearchParams();

      Object.entries(filtrosCompletos).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/lembretes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao buscar lembretes');
      }

      setLembretes(data.dados);
      setPaginacao(data.paginacao);

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagemErro);
      toast({
        title: 'Erro ao buscar lembretes',
        description: mensagemErro,
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  }, [filtros, toast]);

  /**
   * Busca um lembrete específico por ID
   */
  const buscarLembrete = useCallback(async (id: string): Promise<Lembrete | null> => {
    try {
      const response = await fetch(`/api/lembretes/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao buscar lembrete');
      }

      return data.dados;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao buscar lembrete',
        description: mensagemErro,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Cria um novo lembrete
   */
  const criarLembrete = useCallback(async (dados: {
    avaliacaoId: string;
    usuarioId: string;
    tipo: 'lembrete' | 'vencimento';
    dataEnvio: string;
    observacoes?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/lembretes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao criar lembrete');
      }

      toast({
        title: 'Lembrete criado',
        description: 'Lembrete criado com sucesso',
      });

      // Atualizar lista de lembretes
      await buscarLembretes();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao criar lembrete',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarLembretes, toast]);

  /**
   * Atualiza um lembrete
   */
  const atualizarLembrete = useCallback(async (id: string, dados: {
    dataEnvio?: string;
    observacoes?: string;
    enviado?: boolean;
    erro?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lembretes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao atualizar lembrete');
      }

      toast({
        title: 'Lembrete atualizado',
        description: 'Lembrete atualizado com sucesso',
      });

      // Atualizar lista de lembretes
      await buscarLembretes();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao atualizar lembrete',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarLembretes, toast]);

  /**
   * Remove um lembrete
   */
  const removerLembrete = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lembretes/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao remover lembrete');
      }

      toast({
        title: 'Lembrete removido',
        description: 'Lembrete removido com sucesso',
      });

      // Atualizar lista de lembretes
      await buscarLembretes();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao remover lembrete',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarLembretes, toast]);

  /**
   * Executa ação em um lembrete
   */
  const executarAcaoLembrete = useCallback(async (id: string, acao: string, dados?: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lembretes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao, ...dados }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao executar ação');
      }

      toast({
        title: 'Ação executada',
        description: data.mensagem || 'Ação executada com sucesso',
      });

      // Atualizar lista de lembretes
      await buscarLembretes();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao executar ação',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarLembretes, toast]);

  /**
   * Remove lembretes em lote
   */
  const removerLembretesLote = useCallback(async (acao: string, parametros: any = {}): Promise<boolean> => {
    try {
      const params = new URLSearchParams({ acao, ...parametros });
      const response = await fetch(`/api/lembretes?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao remover lembretes');
      }

      toast({
        title: 'Lembretes removidos',
        description: data.mensagem || 'Lembretes removidos com sucesso',
      });

      // Atualizar lista de lembretes
      await buscarLembretes();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao remover lembretes',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarLembretes, toast]);

  // Carregar lembretes na inicialização
  useEffect(() => {
    buscarLembretes();
  }, [buscarLembretes]);

  return {
    lembretes,
    paginacao,
    carregando,
    erro,
    buscarLembretes,
    buscarLembrete,
    criarLembrete,
    atualizarLembrete,
    removerLembrete,
    executarAcaoLembrete,
    removerLembretesLote,
  };
}

/**
 * Hook para gerenciar o agendador de lembretes
 */
export function useAgendadorLembretes() {
  const [status, setStatus] = useState<StatusAgendador | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Busca o status do agendador
   */
  const buscarStatus = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/lembretes/agendamento');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao buscar status do agendador');
      }

      setStatus(data.dados);

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagemErro);
      toast({
        title: 'Erro ao buscar status',
        description: mensagemErro,
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  /**
   * Atualiza a configuração do agendador
   */
  const atualizarConfiguracao = useCallback(async (configuracao: ConfiguracaoAgendador): Promise<boolean> => {
    try {
      const response = await fetch('/api/lembretes/agendamento', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuracao),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao atualizar configuração');
      }

      toast({
        title: 'Configuração atualizada',
        description: 'Configuração do agendador atualizada com sucesso',
      });

      // Atualizar status
      await buscarStatus();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao atualizar configuração',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarStatus, toast]);

  /**
   * Executa ação no agendador
   */
  const executarAcao = useCallback(async (acao: string, dados?: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/lembretes/agendamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao, ...dados }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao executar ação');
      }

      toast({
        title: 'Ação executada',
        description: data.mensagem || 'Ação executada com sucesso',
      });

      // Atualizar status
      await buscarStatus();
      return true;

    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao executar ação',
        description: mensagemErro,
        variant: 'destructive',
      });
      return false;
    }
  }, [buscarStatus, toast]);

  // Carregar status na inicialização
  useEffect(() => {
    buscarStatus();
  }, [buscarStatus]);

  return {
    status,
    carregando,
    erro,
    buscarStatus,
    atualizarConfiguracao,
    executarAcao,
  };
}

export type {
  Lembrete,
  ConfiguracaoAgendador,
  StatusAgendador,
  FiltrosLembretes,
  PaginacaoLembretes,
  ResultadoLembretes,
};