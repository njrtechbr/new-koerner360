import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { useNotificacoesAvaliacoes } from '../use-notificacoes-avaliacoes';
import { useToast } from '../use-toast';

// Mock do hook useToast
jest.mock('../use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock do fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock dos dados de teste
const mockNotificacoes = [
  {
    id: '1',
    tipo: 'AVALIACAO_PENDENTE' as const,
    titulo: 'Avaliação Pendente',
    mensagem: 'Você tem uma avaliação pendente',
    urgencia: 'MEDIA' as const,
    lida: false,
    criadaEm: new Date().toISOString(),
    usuario: {
      id: '1',
      nome: 'João Silva',
      email: 'joao@teste.com',
    },
    avaliacao: {
      id: '1',
      titulo: 'Avaliação Q1 2024',
      prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

const mockEstatisticas = {
  totalNotificacoes: 5,
  naoLidas: 3,
  porTipo: {
    AVALIACAO_PENDENTE: 2,
    AVALIACAO_VENCIDA: 1,
    AVALIACAO_PROXIMA_VENCIMENTO: 0,
    NOVA_AVALIACAO_RECEBIDA: 1,
    AVALIACAO_COMPLETADA: 1,
    LEMBRETE_PERSONALIZADO: 0,
  },
  porUrgencia: {
    BAIXA: 1,
    MEDIA: 3,
    ALTA: 1,
  },
};

describe('useNotificacoesAvaliacoes', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarNotificacoes', () => {
    it('deve buscar notificações com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notificacoes: mockNotificacoes,
          total: 1,
          pagina: 1,
          totalPaginas: 1,
        }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.buscarNotificacoes();
      });

      expect(result.current.notificacoes).toEqual(mockNotificacoes);
      expect(result.current.carregando).toBe(false);
      expect(result.current.erro).toBeNull();
    });

    it('deve lidar com erro na busca', async () => {
      const errorMessage = 'Erro ao buscar notificações';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.buscarNotificacoes();
      });

      expect(result.current.notificacoes).toEqual([]);
      expect(result.current.carregando).toBe(false);
      expect(result.current.erro).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('deve aplicar filtros corretamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notificacoes: mockNotificacoes,
          total: 1,
          pagina: 1,
          totalPaginas: 1,
        }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      const filtros = {
        tipo: 'AVALIACAO_PENDENTE' as const,
        urgencia: 'ALTA' as const,
        lida: false,
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-12-31'),
      };

      await act(async () => {
        await result.current.buscarNotificacoes(filtros);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notificacoes-avaliacoes'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      // Verificar se os parâmetros de query foram construídos corretamente
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('tipo=AVALIACAO_PENDENTE');
      expect(url).toContain('urgencia=ALTA');
      expect(url).toContain('lida=false');
    });
  });

  describe('marcarComoLida', () => {
    it('deve marcar notificação como lida com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      // Definir notificações iniciais
      act(() => {
        result.current.notificacoes = mockNotificacoes;
      });

      await act(async () => {
        await result.current.marcarComoLida('1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notificacoes-avaliacoes/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ acao: 'marcar_lida' }),
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Notificação marcada como lida',
      });
    });

    it('deve lidar com erro ao marcar como lida', async () => {
      const errorMessage = 'Erro ao marcar como lida';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.marcarComoLida('1');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  describe('marcarTodasComoLidas', () => {
    it('deve marcar todas as notificações como lidas com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ marcadas: 3 }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.marcarTodasComoLidas();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notificacoes-avaliacoes/marcar-todas-lidas',
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: '3 notificações marcadas como lidas',
      });
    });
  });

  describe('removerNotificacao', () => {
    it('deve remover notificação com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.removerNotificacao('1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notificacoes-avaliacoes/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Notificação removida com sucesso',
      });
    });
  });

  describe('buscarEstatisticas', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEstatisticas,
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.buscarEstatisticas();
      });

      expect(result.current.estatisticas).toEqual(mockEstatisticas);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notificacoes-avaliacoes/estatisticas',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('gerarNotificacoes', () => {
    it('deve gerar notificações com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ geradas: 5 }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.gerarNotificacoes();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notificacoes-avaliacoes/gerar',
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: '5 notificações geradas com sucesso',
      });
    });
  });

  describe('limparNotificacoes', () => {
    it('deve limpar notificações antigas com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ removidas: 10 }),
      });

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      await act(async () => {
        await result.current.limparNotificacoes(30);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notificacoes-avaliacoes/limpar',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ diasAntigos: 30 }),
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: '10 notificações antigas removidas',
      });
    });
  });

  describe('estados de carregamento', () => {
    it('deve gerenciar estado de carregamento corretamente', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useNotificacoesAvaliacoes());

      // Iniciar busca
      act(() => {
        result.current.buscarNotificacoes();
      });

      // Verificar que está carregando
      expect(result.current.carregando).toBe(true);

      // Resolver promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({
            notificacoes: [],
            total: 0,
            pagina: 1,
            totalPaginas: 1,
          }),
        });
      });

      // Verificar que não está mais carregando
      expect(result.current.carregando).toBe(false);
    });
  });
});