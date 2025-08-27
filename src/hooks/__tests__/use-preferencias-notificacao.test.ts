import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { usePreferenciasNotificacao } from '../use-preferencias-notificacao';
import { useToast } from '../use-toast';
import type { PreferenciasNotificacao, PreferenciasNotificacaoInput } from '../../lib/types/preferencias-notificacao';

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
const mockPreferencias: PreferenciasNotificacao = {
  id: '1',
  usuarioId: 'user-1',
  ativo: true,
  email: {
    ativo: true,
    formato: 'html',
  },
  idioma: 'pt-BR',
  conteudo: {
    incluirDetalhesAvaliacao: true,
    incluirLinkDireto: true,
    incluirResumoEstatisticas: false,
  },
  urgenciaMinima: 'media',
  tipos: {
    avaliacaoPendente: {
      ativo: true,
      frequencia: 'diaria',
      diasAntecedencia: 3,
    },
    avaliacaoVencida: {
      ativo: true,
      frequencia: 'imediata',
    },
    avaliacaoProximaVencimento: {
      ativo: true,
      frequencia: 'diaria',
      diasAntecedencia: 1,
    },
    novaAvaliacao: {
      ativo: false,
      frequencia: 'imediata',
    },
    avaliacaoCompletada: {
      ativo: false,
      frequencia: 'semanal',
    },
    lembretePersonalizado: {
      ativo: true,
      frequencia: 'conforme_agendado',
    },
  },
  horario: {
    envio: '09:00',
    incluirFinsDeSemanaSemana: false,
    incluirFeriados: false,
  },
  filtros: {
    apenasMinhasAvaliacoes: false,
    apenasAvaliacoesQueAvalia: true,
  },
  pausa: {
    ativo: false,
    ate: null,
    motivo: null,
  },
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
};

const mockStatusPausa = {
  pausado: false,
  ate: null,
  motivo: null,
};

describe('usePreferenciasNotificacao', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarPreferencias', () => {
    it('deve buscar preferências com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferencias,
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.buscarPreferencias();
      });

      expect(result.current.preferencias).toEqual(mockPreferencias);
      expect(result.current.carregando).toBe(false);
      expect(result.current.erro).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('deve lidar com erro na busca das preferências', async () => {
      const errorMessage = 'Erro ao buscar preferências';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.buscarPreferencias();
      });

      expect(result.current.preferencias).toBeNull();
      expect(result.current.carregando).toBe(false);
      expect(result.current.erro).toBe(errorMessage);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    });

    it('deve buscar preferências automaticamente no mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferencias,
      });

      renderHook(() => usePreferenciasNotificacao());

      // Aguardar um tick para o useEffect executar
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('atualizarPreferencias', () => {
    it('deve atualizar preferências com sucesso', async () => {
      const novasPreferencias: PreferenciasNotificacaoInput = {
        ativo: false,
        email: {
          ativo: false,
          formato: 'texto',
        },
        urgenciaMinima: 'alta',
      };

      const preferenciasAtualizadas = {
        ...mockPreferencias,
        ...novasPreferencias,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => preferenciasAtualizadas,
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      let resultado;
      await act(async () => {
        resultado = await result.current.atualizarPreferencias(novasPreferencias);
      });

      expect(resultado).toEqual(preferenciasAtualizadas);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novasPreferencias),
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Preferências atualizadas com sucesso',
      });
    });

    it('deve lidar com erro ao atualizar preferências', async () => {
      const errorMessage = 'Erro ao atualizar preferências';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePreferenciasNotificacao());

      const novasPreferencias: PreferenciasNotificacaoInput = {
        ativo: false,
      };

      let resultado;
      await act(async () => {
        resultado = await result.current.atualizarPreferencias(novasPreferencias);
      });

      expect(resultado).toBeNull();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  describe('resetarPreferencias', () => {
    it('deve resetar preferências com sucesso', async () => {
      const preferenciasDefault = {
        ...mockPreferencias,
        ativo: false,
        tipos: {
          avaliacaoPendente: { ativo: false, frequencia: 'diaria' },
          avaliacaoVencida: { ativo: false, frequencia: 'imediata' },
          avaliacaoProximaVencimento: { ativo: false, frequencia: 'diaria' },
          novaAvaliacao: { ativo: false, frequencia: 'imediata' },
          avaliacaoCompletada: { ativo: false, frequencia: 'semanal' },
          lembretePersonalizado: { ativo: false, frequencia: 'conforme_agendado' },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => preferenciasDefault,
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      let resultado;
      await act(async () => {
        resultado = await result.current.resetarPreferencias();
      });

      expect(resultado).toEqual(preferenciasDefault);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Preferências resetadas para os valores padrão',
      });
    });
  });

  describe('pausarNotificacoes', () => {
    it('deve pausar notificações com sucesso', async () => {
      const ate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      const motivo = 'Férias';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      let sucesso;
      await act(async () => {
        sucesso = await result.current.pausarNotificacoes(ate, motivo);
      });

      expect(sucesso).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao/pausar',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ate: ate.toISOString(),
            motivo,
          }),
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Notificações pausadas com sucesso',
      });
    });

    it('deve pausar notificações sem motivo', async () => {
      const ate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 dia

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.pausarNotificacoes(ate);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao/pausar',
        expect.objectContaining({
          body: JSON.stringify({
            ate: ate.toISOString(),
          }),
        })
      );
    });

    it('deve lidar com erro ao pausar notificações', async () => {
      const errorMessage = 'Erro ao pausar notificações';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePreferenciasNotificacao());

      const ate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      let sucesso;
      await act(async () => {
        sucesso = await result.current.pausarNotificacoes(ate);
      });

      expect(sucesso).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  describe('retomarNotificacoes', () => {
    it('deve retomar notificações com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      let sucesso;
      await act(async () => {
        sucesso = await result.current.retomarNotificacoes();
      });

      expect(sucesso).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao/pausar',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sucesso',
        description: 'Notificações retomadas com sucesso',
      });
    });

    it('deve lidar com erro ao retomar notificações', async () => {
      const errorMessage = 'Erro ao retomar notificações';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePreferenciasNotificacao());

      let sucesso;
      await act(async () => {
        sucesso = await result.current.retomarNotificacoes();
      });

      expect(sucesso).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  describe('verificarStatusPausa', () => {
    it('deve verificar status de pausa com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatusPausa,
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.verificarStatusPausa();
      });

      expect(result.current.statusPausa).toEqual(mockStatusPausa);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/preferencias-notificacao/pausar',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('deve verificar status de pausa pausado', async () => {
      const statusPausado = {
        pausado: true,
        ate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        motivo: 'Férias',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => statusPausado,
      });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.verificarStatusPausa();
      });

      expect(result.current.statusPausa).toEqual(statusPausado);
    });

    it('deve lidar com erro ao verificar status de pausa', async () => {
      const errorMessage = 'Erro ao verificar status';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.verificarStatusPausa();
      });

      expect(result.current.statusPausa).toBeNull();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
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

      const { result } = renderHook(() => usePreferenciasNotificacao());

      // Iniciar busca
      act(() => {
        result.current.buscarPreferencias();
      });

      // Verificar que está carregando
      expect(result.current.carregando).toBe(true);

      // Resolver promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => mockPreferencias,
        });
      });

      // Verificar que não está mais carregando
      expect(result.current.carregando).toBe(false);
    });
  });

  describe('atualização automática após ações', () => {
    it('deve atualizar preferências após pausar notificações', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreferencias,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockStatusPausa, pausado: true }),
        });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      const ate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await act(async () => {
        await result.current.pausarNotificacoes(ate, 'Teste');
      });

      // Verificar que as funções de busca foram chamadas após a ação
      expect(mockFetch).toHaveBeenCalledTimes(3); // pausar + buscarPreferencias + verificarStatusPausa
    });

    it('deve atualizar preferências após retomar notificações', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreferencias,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatusPausa,
        });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      await act(async () => {
        await result.current.retomarNotificacoes();
      });

      // Verificar que as funções de busca foram chamadas após a ação
      expect(mockFetch).toHaveBeenCalledTimes(3); // retomar + buscarPreferencias + verificarStatusPausa
    });
  });

  describe('integração completa', () => {
    it('deve executar fluxo completo de configuração', async () => {
      // Setup mocks para todas as chamadas
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreferencias,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatusPausa,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockPreferencias, ativo: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreferencias,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockStatusPausa, pausado: true }),
        });

      const { result } = renderHook(() => usePreferenciasNotificacao());

      // Aguardar carregamento inicial
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 1. Verificar status de pausa
      await act(async () => {
        await result.current.verificarStatusPausa();
      });
      expect(result.current.statusPausa).toEqual(mockStatusPausa);

      // 2. Atualizar preferências
      await act(async () => {
        await result.current.atualizarPreferencias({ ativo: false });
      });

      // 3. Pausar notificações
      const ate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await act(async () => {
        await result.current.pausarNotificacoes(ate, 'Teste');
      });

      // Verificar que todas as chamadas foram feitas
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });
});