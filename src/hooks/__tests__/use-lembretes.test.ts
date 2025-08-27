import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { useLembretes } from '../use-lembretes';

// Mock do hook useToast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock do fetch global
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock dos dados de teste
const mockResultadoLembretes = {
  dados: [
    {
      id: '1',
      avaliacaoId: '1',
      usuarioId: '1',
      tipo: 'lembrete',
      dataEnvio: new Date().toISOString(),
      enviado: false,
      tentativas: 0,
      ultimaTentativa: null,
      erro: null,
      criadoEm: new Date().toISOString(),
      usuario: {
        id: '1',
        nome: 'João Silva',
        email: 'joao@teste.com',
      },
      avaliacao: {
        id: '1',
        prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pendente',
        avaliado: {
          id: '1',
          nome: 'João Silva',
          email: 'joao@teste.com',
        },
        avaliador: {
          id: '2',
          nome: 'Maria Santos',
          email: 'maria@teste.com',
        },
        periodo: {
          id: '1',
          nome: 'Q1 2024',
          dataInicio: '2024-01-01',
          dataFim: '2024-03-31',
        },
      },
    },
  ],
  paginacao: {
    paginaAtual: 1,
    totalPaginas: 1,
    totalItens: 1,
    itensPorPagina: 50,
    temProximaPagina: false,
    temPaginaAnterior: false,
  },
};

describe('useLembretes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock inicial para useEffect
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResultadoLembretes,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('inicialização', () => {
    it('deve carregar lembretes na inicialização', async () => {
      const { result } = renderHook(() => useLembretes());

      // Aguardar o useEffect executar
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.lembretes).toEqual(mockResultadoLembretes.dados);
      expect(result.current.erro).toBeNull();
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('buscarLembretes', () => {
    it('deve buscar lembretes com sucesso', async () => {
      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      // Fazer nova busca
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResultadoLembretes,
      });

      await act(async () => {
        await result.current.buscarLembretes();
      });

      expect(result.current.lembretes).toEqual(mockResultadoLembretes.dados);
      expect(result.current.carregando).toBe(false);
      expect(result.current.erro).toBeNull();
    });

    it('deve lidar com erro na busca', async () => {
      const errorMessage = 'Erro ao buscar lembretes';

      // Forçar todas as chamadas a retornarem erro neste teste (evita corrida com StrictMode)
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: false,
        json: async () => ({ erro: errorMessage }),
      } as any));

      const { result } = renderHook(() => useLembretes());

      // Aguarda estado ser atualizado pelo fluxo de erro
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
        expect(result.current.erro).toBe(errorMessage);
      }, { timeout: 15000 });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro ao buscar lembretes',
        description: errorMessage,
        variant: 'destructive',
      });
      // Não afirmar contagem exata devido a possíveis chamadas duplicadas em StrictMode
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('buscarLembrete', () => {
    it('deve buscar lembrete específico com sucesso', async () => {
      // Configurar mocks separadamente para evitar interferência e cobrir chamadas duplicadas
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResultadoLembretes,
      } as any);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResultadoLembretes,
      } as any);

      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      // Mock para buscarLembrete específico
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dados: mockResultadoLembretes.dados[0] }),
      } as any);

      let lembrete;
      await act(async () => {
        lembrete = await result.current.buscarLembrete('1');
      });

      // Verifica se retorna o objeto direto
      expect(lembrete).toEqual(mockResultadoLembretes.dados[0]);
      expect(mockFetch).toHaveBeenCalledWith('/api/lembretes/1');
    });

    it('deve lidar com erro ao buscar lembrete específico', async () => {
      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      const errorMessage = 'Lembrete não encontrado';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      let lembrete;
      await act(async () => {
        lembrete = await result.current.buscarLembrete('999');
      });

      expect(lembrete).toBeNull();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro ao buscar lembrete',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  describe('criarLembrete', () => {
    it('deve criar lembrete com sucesso', async () => {
      const novoLembrete = {
        avaliacaoId: '1',
        usuarioId: '1',
        tipo: 'lembrete' as const,
        dataEnvio: new Date().toISOString(),
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ dados: { ...novoLembrete, id: '2' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResultadoLembretes,
        });

      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      let sucesso;
      await act(async () => {
        sucesso = await result.current.criarLembrete(novoLembrete);
      });

      expect(sucesso).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lembrete criado',
        description: 'Lembrete criado com sucesso',
      });
    });

    it('deve lidar com erro ao criar lembrete', async () => {
      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      const errorMessage = 'Erro ao criar lembrete';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const novoLembrete = {
        avaliacaoId: '1',
        usuarioId: '1',
        tipo: 'lembrete' as const,
        dataEnvio: new Date().toISOString(),
      };

      let sucesso;
      await act(async () => {
        sucesso = await result.current.criarLembrete(novoLembrete);
      });

      expect(sucesso).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro ao criar lembrete',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  describe('atualizarLembrete', () => {
    it('deve atualizar lembrete com sucesso', async () => {
      const dadosAtualizacao = {
        dataEnvio: new Date().toISOString(),
        observacoes: 'Observação atualizada',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ dados: { ...mockResultadoLembretes.dados[0], ...dadosAtualizacao } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResultadoLembretes,
        });

      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      let sucesso;
      await act(async () => {
        sucesso = await result.current.atualizarLembrete('1', dadosAtualizacao);
      });

      expect(sucesso).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lembrete atualizado',
        description: 'Lembrete atualizado com sucesso',
      });
    });
  });

  describe('removerLembrete', () => {
    it('deve remover lembrete com sucesso', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResultadoLembretes,
        });

      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      let sucesso;
      await act(async () => {
        sucesso = await result.current.removerLembrete('1');
      });

      expect(sucesso).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lembrete removido',
        description: 'Lembrete removido com sucesso',
      });
    });
  });

  describe('executarAcaoLembrete', () => {
    it('deve executar ação no lembrete com sucesso', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ mensagem: 'Ação executada com sucesso' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResultadoLembretes,
        });

      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      let sucesso;
      await act(async () => {
        sucesso = await result.current.executarAcaoLembrete('1', 'reenviar');
      });

      expect(sucesso).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Ação executada',
        description: 'Ação executada com sucesso',
      });
    });
  });

  describe('removerLembretesLote', () => {
    it('deve remover lembretes em lote com sucesso', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ mensagem: 'Lembretes removidos com sucesso' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResultadoLembretes,
        });

      const { result } = renderHook(() => useLembretes());

      // Aguardar inicialização
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      let sucesso;
      await act(async () => {
        sucesso = await result.current.removerLembretesLote('limpeza', { dias: 30 });
      });

      expect(sucesso).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lembretes removidos',
        description: 'Lembretes removidos com sucesso',
      });
    });
  });

  describe('estados', () => {
    it('deve gerenciar estado de carregamento corretamente', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      // Mock fetch para simular delay
      mockFetch.mockImplementationOnce(() => promise as any);

      const { result } = renderHook(() => useLembretes());

      // Inicialmente deve estar carregando (buscarLembretes é chamado no useEffect)
      await waitFor(() => {
        expect(result.current.carregando).toBe(true);
      }, { timeout: 15000 });

      // Resolve promise para finalizar carregamento
      resolvePromise({
        ok: true,
        json: async () => mockResultadoLembretes
      });

      // Aguarda o carregamento terminar
      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      }, { timeout: 15000 });
    }, 20000);

    it('deve gerenciar paginação corretamente', async () => {
      const resultadoComPaginacao = {
        ...mockResultadoLembretes,
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 3,
          totalItens: 25,
          itensPorPagina: 10
        }
      };

      // Mock dinâmico baseado na URL para ser resiliente a chamadas extras
      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        // Extrai a URL de forma robusta (suporta string, URL e Request)
        let urlStr: string;
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.toString();
        } else {
          // Pode ser um Request-like com propriedade url
          // @ts-ignore - ambiente de teste pode não ter tipo Request completo
          urlStr = input?.url ?? String(input);
        }

        // Garante URL absoluta para usar URLSearchParams
        let paginaParam = 1;
        try {
          const parsed = new URL(urlStr, 'http://localhost');
          const p = parsed.searchParams.get('pagina');
          paginaParam = p ? Number(p) : 1;
        } catch {
          // Se não conseguir parsear, mantém página 1
          paginaParam = 1;
        }

        const resposta = {
          ...resultadoComPaginacao,
          paginacao: { ...resultadoComPaginacao.paginacao, paginaAtual: paginaParam }
        };

        return Promise.resolve({
          ok: true,
          json: async () => resposta
        } as any);
      });

      const { result } = renderHook(() => useLembretes());

      // Aguarda a páginação real ser aplicada após a busca inicial
      await waitFor(() => {
        expect(result.current.paginacao.totalPaginas).toBe(3);
      }, { timeout: 15000 });

      // Verifica estado inicial da paginação (após a busca)
      expect(result.current.paginacao.paginaAtual).toBe(1);
      expect(result.current.paginacao.totalPaginas).toBe(3);

      // Testa navegação para próxima página usando a API real do hook
      await act(async () => {
        await result.current.buscarLembretes({ pagina: 2 });
      });

      await waitFor(() => {
        expect(result.current.paginacao.paginaAtual).toBe(2);
      }, { timeout: 15000 });
    }, 20000);
  });
});