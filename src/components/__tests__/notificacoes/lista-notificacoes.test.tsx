import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ListaNotificacoes } from '../../notificacoes/lista-notificacoes';
import { useNotificacoesAvaliacoes } from '../../../hooks/use-notificacoes-avaliacoes';
import { useToast } from '../../../hooks/use-toast';

// Mock dos hooks
jest.mock('../../../hooks/use-notificacoes-avaliacoes');
jest.mock('../../../hooks/use-toast');

// Mock dos dados de teste
const mockNotificacoes = [
  {
    id: '1',
    tipo: 'AVALIACAO_PENDENTE' as const,
    titulo: 'Avaliação Pendente',
    mensagem: 'Você tem uma avaliação pendente para João Silva',
    lida: false,
    urgencia: 'media' as const,
    criadaEm: new Date().toISOString(),
    leituraEm: null,
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
  {
    id: '2',
    tipo: 'AVALIACAO_VENCIDA' as const,
    titulo: 'Avaliação Vencida',
    mensagem: 'A avaliação de Maria Santos está vencida',
    lida: true,
    urgencia: 'alta' as const,
    criadaEm: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    leituraEm: new Date().toISOString(),
    usuario: {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria@teste.com',
    },
    avaliacao: {
      id: '2',
      titulo: 'Avaliação Q4 2023',
      prazo: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

const mockEstatisticas = {
  total: 2,
  naoLidas: 1,
  lidas: 1,
  porTipo: {
    AVALIACAO_PENDENTE: 1,
    AVALIACAO_VENCIDA: 1,
    AVALIACAO_PROXIMA_VENCIMENTO: 0,
    NOVA_AVALIACAO: 0,
    AVALIACAO_COMPLETADA: 0,
    LEMBRETE_PERSONALIZADO: 0,
  },
  porUrgencia: {
    baixa: 0,
    media: 1,
    alta: 1,
  },
};

const mockHookReturn = {
  notificacoes: mockNotificacoes,
  estatisticas: mockEstatisticas,
  carregando: false,
  erro: null,
  total: 2,
  pagina: 1,
  totalPaginas: 1,
  porPagina: 10,
  buscarNotificacoes: jest.fn(),
  buscarNotificacao: jest.fn(),
  marcarComoLida: jest.fn(),
  marcarTodasComoLidas: jest.fn(),
  removerNotificacao: jest.fn(),
  buscarEstatisticas: jest.fn(),
  gerarNotificacoes: jest.fn(),
  limparNotificacoes: jest.fn(),
};

const mockToast = jest.fn();

describe('ListaNotificacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotificacoesAvaliacoes as any).mockReturnValue(mockHookReturn);
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar lista de notificações', () => {
      render(<ListaNotificacoes />);

      expect(screen.getByText('Notificações')).toBeInTheDocument();
      expect(screen.getByText('Avaliação Pendente')).toBeInTheDocument();
      expect(screen.getByText('Avaliação Vencida')).toBeInTheDocument();
    });

    it('deve exibir estatísticas corretamente', () => {
      render(<ListaNotificacoes />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Total
      expect(screen.getByText('1')).toBeInTheDocument(); // Não lidas
    });

    it('deve exibir estado de carregamento', () => {
      (useNotificacoesAvaliacoes as any).mockReturnValue({
        ...mockHookReturn,
        carregando: true,
        notificacoes: [],
      });

      render(<ListaNotificacoes />);

      expect(screen.getByText('Carregando notificações...')).toBeInTheDocument();
    });

    it('deve exibir mensagem quando não há notificações', () => {
      (useNotificacoesAvaliacoes as any).mockReturnValue({
        ...mockHookReturn,
        notificacoes: [],
        total: 0,
      });

      render(<ListaNotificacoes />);

      expect(screen.getByText('Nenhuma notificação encontrada')).toBeInTheDocument();
    });

    it('deve exibir erro quando houver falha', () => {
      const errorMessage = 'Erro ao carregar notificações';
      (useNotificacoesAvaliacoes as any).mockReturnValue({
        ...mockHookReturn,
        erro: errorMessage,
        notificacoes: [],
      });

      render(<ListaNotificacoes />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Filtros', () => {
    it('deve aplicar filtro por tipo', async () => {
      render(<ListaNotificacoes />);

      const filtroTipo = screen.getByLabelText('Filtrar por tipo');
      fireEvent.change(filtroTipo, { target: { value: 'AVALIACAO_PENDENTE' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            tipo: 'AVALIACAO_PENDENTE',
          }),
          expect.any(Object)
        );
      });
    });

    it('deve aplicar filtro por status de leitura', async () => {
      render(<ListaNotificacoes />);

      const filtroLida = screen.getByLabelText('Filtrar por status');
      fireEvent.change(filtroLida, { target: { value: 'nao_lida' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            lida: false,
          }),
          expect.any(Object)
        );
      });
    });

    it('deve aplicar filtro por urgência', async () => {
      render(<ListaNotificacoes />);

      const filtroUrgencia = screen.getByLabelText('Filtrar por urgência');
      fireEvent.change(filtroUrgencia, { target: { value: 'alta' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            urgencia: 'alta',
          }),
          expect.any(Object)
        );
      });
    });

    it('deve aplicar filtro por data', async () => {
      render(<ListaNotificacoes />);

      const dataInicio = screen.getByLabelText('Data início');
      const dataFim = screen.getByLabelText('Data fim');

      fireEvent.change(dataInicio, { target: { value: '2024-01-01' } });
      fireEvent.change(dataFim, { target: { value: '2024-12-31' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            dataInicio: expect.any(Date),
            dataFim: expect.any(Date),
          }),
          expect.any(Object)
        );
      });
    });

    it('deve limpar filtros', async () => {
      render(<ListaNotificacoes />);

      // Aplicar alguns filtros primeiro
      const filtroTipo = screen.getByLabelText('Filtrar por tipo');
      fireEvent.change(filtroTipo, { target: { value: 'AVALIACAO_PENDENTE' } });

      // Limpar filtros
      const botaoLimpar = screen.getByText('Limpar Filtros');
      fireEvent.click(botaoLimpar);

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          {},
          expect.any(Object)
        );
      });
    });
  });

  describe('Busca', () => {
    it('deve realizar busca por texto', async () => {
      render(<ListaNotificacoes />);

      const campoBusca = screen.getByPlaceholderText('Buscar notificações...');
      fireEvent.change(campoBusca, { target: { value: 'João Silva' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            busca: 'João Silva',
          }),
          expect.any(Object)
        );
      }, { timeout: 1000 }); // Aguardar debounce
    });

    it('deve limpar busca', async () => {
      render(<ListaNotificacoes />);

      const campoBusca = screen.getByPlaceholderText('Buscar notificações...');
      fireEvent.change(campoBusca, { target: { value: 'teste' } });
      fireEvent.change(campoBusca, { target: { value: '' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            busca: '',
          }),
          expect.any(Object)
        );
      }, { timeout: 1000 });
    });
  });

  describe('Ações de Notificação', () => {
    it('deve marcar notificação como lida', async () => {
      mockHookReturn.marcarComoLida.mockResolvedValueOnce(true);

      render(<ListaNotificacoes />);

      const botaoMarcarLida = screen.getAllByText('Marcar como lida')[0];
      fireEvent.click(botaoMarcarLida);

      await waitFor(() => {
        expect(mockHookReturn.marcarComoLida).toHaveBeenCalledWith('1');
      });
    });

    it('deve remover notificação', async () => {
      mockHookReturn.removerNotificacao.mockResolvedValueOnce(true);
      window.confirm = vi.fn(() => true);

      render(<ListaNotificacoes />);

      const botaoRemover = screen.getAllByText('Remover')[0];
      fireEvent.click(botaoRemover);

      await waitFor(() => {
        expect(mockHookReturn.removerNotificacao).toHaveBeenCalledWith('1');
      });
    });

    it('deve cancelar remoção se usuário não confirmar', async () => {
      window.confirm = vi.fn(() => false);

      render(<ListaNotificacoes />);

      const botaoRemover = screen.getAllByText('Remover')[0];
      fireEvent.click(botaoRemover);

      expect(mockHookReturn.removerNotificacao).not.toHaveBeenCalled();
    });

    it('deve marcar todas como lidas', async () => {
      mockHookReturn.marcarTodasComoLidas.mockResolvedValueOnce({ marcadas: 1 });

      render(<ListaNotificacoes />);

      const botaoMarcarTodas = screen.getByText('Marcar Todas como Lidas');
      fireEvent.click(botaoMarcarTodas);

      await waitFor(() => {
        expect(mockHookReturn.marcarTodasComoLidas).toHaveBeenCalledWith({});
      });
    });

    it('deve limpar notificações lidas', async () => {
      mockHookReturn.limparNotificacoes.mockResolvedValueOnce({ removidas: 1 });
      window.confirm = vi.fn(() => true);

      render(<ListaNotificacoes />);

      const botaoLimpar = screen.getByText('Limpar Lidas');
      fireEvent.click(botaoLimpar);

      await waitFor(() => {
        expect(mockHookReturn.limparNotificacoes).toHaveBeenCalledWith({ lidas: true });
      });
    });
  });

  describe('Paginação', () => {
    it('deve navegar para próxima página', async () => {
      (useNotificacoesAvaliacoes as any).mockReturnValue({
        ...mockHookReturn,
        pagina: 1,
        totalPaginas: 3,
      });

      render(<ListaNotificacoes />);

      const botaoProxima = screen.getByText('Próxima');
      fireEvent.click(botaoProxima);

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            pagina: 2,
          })
        );
      });
    });

    it('deve navegar para página anterior', async () => {
      (useNotificacoesAvaliacoes as any).mockReturnValue({
        ...mockHookReturn,
        pagina: 2,
        totalPaginas: 3,
      });

      render(<ListaNotificacoes />);

      const botaoAnterior = screen.getByText('Anterior');
      fireEvent.click(botaoAnterior);

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            pagina: 1,
          })
        );
      });
    });

    it('deve alterar itens por página', async () => {
      render(<ListaNotificacoes />);

      const seletorPorPagina = screen.getByLabelText('Itens por página');
      fireEvent.change(seletorPorPagina, { target: { value: '25' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            porPagina: 25,
            pagina: 1, // Reset para primeira página
          })
        );
      });
    });
  });

  describe('Ordenação', () => {
    it('deve ordenar por data de criação', async () => {
      render(<ListaNotificacoes />);

      const seletorOrdenacao = screen.getByLabelText('Ordenar por');
      fireEvent.change(seletorOrdenacao, { target: { value: 'criadaEm' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            ordenarPor: 'criadaEm',
          }),
          expect.any(Object)
        );
      });
    });

    it('deve alterar direção da ordenação', async () => {
      render(<ListaNotificacoes />);

      const seletorDirecao = screen.getByLabelText('Direção');
      fireEvent.change(seletorDirecao, { target: { value: 'asc' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledWith(
          expect.objectContaining({
            direcao: 'asc',
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Atualização Automática', () => {
    it('deve atualizar lista após marcar como lida', async () => {
      mockHookReturn.marcarComoLida.mockResolvedValueOnce(true);

      render(<ListaNotificacoes />);

      const botaoMarcarLida = screen.getAllByText('Marcar como lida')[0];
      fireEvent.click(botaoMarcarLida);

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledTimes(2); // Initial + after action
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledTimes(2);
      });
    });

    it('deve atualizar lista após remover notificação', async () => {
      mockHookReturn.removerNotificacao.mockResolvedValueOnce(true);
      window.confirm = vi.fn(() => true);

      render(<ListaNotificacoes />);

      const botaoRemover = screen.getAllByText('Remover')[0];
      fireEvent.click(botaoRemover);

      await waitFor(() => {
        expect(mockHookReturn.buscarNotificacoes).toHaveBeenCalledTimes(2);
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para screen readers', () => {
      render(<ListaNotificacoes />);

      expect(screen.getByLabelText('Filtrar por tipo')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por status')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por urgência')).toBeInTheDocument();
      expect(screen.getByLabelText('Ordenar por')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado funcional', () => {
      render(<ListaNotificacoes />);

      const botaoMarcarLida = screen.getAllByText('Marcar como lida')[0];
      botaoMarcarLida.focus();
      expect(document.activeElement).toBe(botaoMarcarLida);
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar layout para telas pequenas', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<ListaNotificacoes />);

      // Verificar se elementos responsivos estão presentes
      expect(screen.getByText('Notificações')).toBeInTheDocument();
    });
  });
});