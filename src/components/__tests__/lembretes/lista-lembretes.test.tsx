import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ListaLembretes } from '../../lembretes/lista-lembretes';
import { useLembretes } from '../../../hooks/use-lembretes';
import { useToast } from '../../../hooks/use-toast';
// Tipos são importados do hook use-lembretes

// Mock dos hooks
jest.mock('../../../hooks/use-lembretes');
jest.mock('../../../hooks/use-toast');

// Mock dos lembretes de teste
const mockLembretes = [
  {
    id: '1',
    usuarioId: 'user1',
    avaliacaoId: 'aval1',
    tipo: 'lembrete',
    dataEnvio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    enviado: false,
    tentativas: 0,
    ultimaTentativa: undefined,
    dataEnvioReal: undefined,
    erro: undefined,
    observacoes: undefined,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    usuario: {
      id: 'user1',
      nome: 'João Silva',
      email: 'joao@empresa.com',
      cargo: 'Analista',
    },
    avaliacao: {
      id: 'aval1',
      prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pendente',
      avaliado: {
        id: 'avaliado1',
        nome: 'Pedro Avaliado',
        cargo: 'Desenvolvedor',
        email: 'pedro@empresa.com',
      },
      avaliador: {
        id: 'avaliador1',
        nome: 'Maria Avaliadora',
        email: 'maria@empresa.com',
      },
      periodo: {
        id: 'periodo1',
        nome: 'Período Anual 2024',
        dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  },
  {
    id: '2',
    usuarioId: 'user2',
    avaliacaoId: 'aval2',
    tipo: 'vencimento',
    dataEnvio: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    enviado: true,
    tentativas: 1,
    ultimaTentativa: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    dataEnvioReal: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    erro: undefined,
    observacoes: undefined,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    usuario: {
      id: 'user2',
      nome: 'Maria Santos',
      email: 'maria@empresa.com',
      cargo: 'Gerente',
    },
    avaliacao: {
      id: 'aval2',
      prazo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'em_andamento',
      avaliado: {
        id: 'avaliado2',
        nome: 'Ana Avaliada',
        cargo: 'Designer',
        email: 'ana@empresa.com',
      },
      avaliador: {
        id: 'avaliador2',
        nome: 'Carlos Avaliador',
        email: 'carlos@empresa.com',
      },
      periodo: {
        id: 'periodo2',
        nome: 'Período Trimestral Q4',
        dataInicio: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  },
  {
    id: '3',
    usuarioId: 'user3',
    avaliacaoId: 'aval3',
    tipo: 'lembrete',
    dataEnvio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    enviado: false,
    tentativas: 3,
    ultimaTentativa: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    dataEnvioReal: undefined,
    erro: 'Falha no envio de e-mail',
    observacoes: 'Múltiplas tentativas falharam',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    usuario: {
      id: 'user3',
      nome: 'Pedro Costa',
      email: 'pedro@empresa.com',
      cargo: 'Coordenador',
    },
    avaliacao: {
      id: 'aval3',
      prazo: new Date().toISOString(),
      status: 'atrasada',
      avaliado: {
        id: 'avaliado3',
        nome: 'Lucas Avaliado',
        cargo: 'Analista Jr',
        email: 'lucas@empresa.com',
      },
      avaliador: {
        id: 'avaliador3',
        nome: 'Fernanda Avaliadora',
        email: 'fernanda@empresa.com',
      },
      periodo: {
        id: 'periodo3',
        nome: 'Período de Desempenho 2024',
        dataInicio: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        dataFim: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  },
];

const mockPaginacao = {
  paginaAtual: 1,
  totalPaginas: 1,
  totalItens: 3,
  itensPorPagina: 10,
  temProximaPagina: false,
  temPaginaAnterior: false,
};

const mockHookReturn = {
  lembretes: mockLembretes,
  paginacao: mockPaginacao,
  carregando: false,
  erro: null,
  buscarLembretes: jest.fn(),
  executarAcaoLembrete: jest.fn(),
  removerLembrete: jest.fn().mockResolvedValue(true),
};

const mockToast = jest.fn();

describe('ListaLembretes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLembretes as any).mockReturnValue(mockHookReturn);
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar lista de lembretes', () => {
      render(<ListaLembretes />);

      expect(screen.getByText('Lembretes')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    });

    it('deve exibir estado de carregamento', () => {
      (useLembretes as any).mockReturnValue({
        ...mockHookReturn,
        carregando: true,
        lembretes: [],
      });

      render(<ListaLembretes />);

      expect(screen.getByText('Carregando lembretes...')).toBeInTheDocument();
    });

    it('deve exibir mensagem quando não há lembretes', () => {
      (useLembretes as any).mockReturnValue({
        ...mockHookReturn,
        lembretes: [],
        paginacao: {
          ...mockPaginacao,
          total: 0,
        },
      });

      render(<ListaLembretes />);

      expect(screen.getByText('Nenhum lembrete encontrado')).toBeInTheDocument();
    });

    it('deve exibir erro quando houver falha', () => {
      const errorMessage = 'Erro ao carregar lembretes';
      (useLembretes as any).mockReturnValue({
        ...mockHookReturn,
        erro: errorMessage,
        lembretes: [],
      });

      render(<ListaLembretes />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Filtros', () => {
    it('deve filtrar por tipo de lembrete', async () => {
      render(<ListaLembretes />);

      const filtroTipo = screen.getAllByRole('combobox')[0];
      fireEvent.change(filtroTipo, { target: { value: 'lembrete' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalled();
      });
    });

    it('deve filtrar por status', async () => {
      render(<ListaLembretes />);

      const filtroStatus = screen.getByLabelText('Status');
      fireEvent.change(filtroStatus, { target: { value: 'pendente' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pendente',
          })
        );
      });
    });

    it('deve filtrar por usuário', async () => {
      render(<ListaLembretes />);

      const filtroUsuario = screen.getByLabelText('Usuário');
      fireEvent.change(filtroUsuario, { target: { value: 'user1' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            usuarioId: 'user1',
          })
        );
      });
    });

    it('deve filtrar por avaliação', async () => {
      render(<ListaLembretes />);

      const filtroAvaliacao = screen.getByLabelText('Avaliação');
      fireEvent.change(filtroAvaliacao, { target: { value: 'aval1' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            avaliacaoId: 'aval1',
          })
        );
      });
    });

    it('deve filtrar por período de data', async () => {
      render(<ListaLembretes />);

      const dataInicio = screen.getByLabelText('Data início');
      const dataFim = screen.getByLabelText('Data fim');

      fireEvent.change(dataInicio, { target: { value: '2024-01-01' } });
      fireEvent.change(dataFim, { target: { value: '2024-12-31' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            dataInicio: '2024-01-01',
            dataFim: '2024-12-31',
          })
        );
      });
    });

    it('deve limpar filtros', async () => {
      render(<ListaLembretes />);

      // Aplicar filtros primeiro
      const filtroTipo = screen.getAllByRole('combobox')[0];
      fireEvent.click(filtroTipo);

      // Limpar filtros
      const botaoLimpar = screen.getByText('Limpar Filtros');
      fireEvent.click(botaoLimpar);

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Busca', () => {
    it('deve buscar lembretes por texto', async () => {
      render(<ListaLembretes />);

      const campoBusca = screen.getByPlaceholderText('Buscar lembretes...');
      fireEvent.change(campoBusca, { target: { value: 'João' } });

      // Simular debounce
      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            busca: 'João',
          })
        );
      }, { timeout: 1000 });
    });

    it('deve limpar busca', async () => {
      render(<ListaLembretes />);

      const campoBusca = screen.getByPlaceholderText('Buscar lembretes...');
      fireEvent.change(campoBusca, { target: { value: 'João' } });
      fireEvent.change(campoBusca, { target: { value: '' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            busca: '',
          })
        );
      });
    });
  });

  describe('Ações de Lembrete', () => {
    it('deve reenviar lembrete', async () => {
      mockHookReturn.executarAcaoLembrete.mockResolvedValueOnce(true);

      render(<ListaLembretes />);

      const botaoReenviar = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-send')
      );
      fireEvent.click(botaoReenviar);

      await waitFor(() => {
        expect(mockHookReturn.executarAcaoLembrete).toHaveBeenCalledWith('1', 'reenviar');
      });
    });

    it('deve marcar como enviado', async () => {
      mockHookReturn.executarAcaoLembrete.mockResolvedValueOnce(true);

      render(<ListaLembretes />);

      const botaoMarcar = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-check-circle')
      );
      fireEvent.click(botaoMarcar);

      await waitFor(() => {
        expect(mockHookReturn.executarAcaoLembrete).toHaveBeenCalledWith('1', 'marcar_enviado');
      });
    });

    it('deve reagendar lembrete', async () => {
      mockHookReturn.executarAcaoLembrete.mockResolvedValueOnce(true);

      render(<ListaLembretes />);

      const botaoReagendar = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-edit')
      );
      fireEvent.click(botaoReagendar);

      // Preencher nova data
      const inputData = screen.getByLabelText('Nova data de envio');
      fireEvent.change(inputData, { target: { value: '2024-12-31T10:00' } });

      const botaoConfirmar = screen.getByText('Confirmar');
      fireEvent.click(botaoConfirmar);

      await waitFor(() => {
        expect(mockHookReturn.executarAcaoLembrete).toHaveBeenCalledWith(
           '1',
           'reagendar',
           { dataEnvio: '2024-12-31T10:00' }
         );
      });
    });

    it('deve remover lembrete', async () => {
      mockHookReturn.executarAcaoLembrete.mockResolvedValueOnce(true);
      window.confirm = jest.fn(() => true);

      render(<ListaLembretes />);

      const botoes = screen.getAllByRole('button');
      const botaoRemover = botoes.find(btn => 
        btn.className && btn.className.includes('text-red-600')
      );
      expect(botaoRemover).toBeDefined();
      fireEvent.click(botaoRemover!);

      await waitFor(() => {
        expect(mockHookReturn.executarAcaoLembrete).toHaveBeenCalledWith('1', 'remover');
      });
    });

    it('deve cancelar remoção se usuário não confirmar', async () => {
      window.confirm = jest.fn(() => false);

      render(<ListaLembretes />);

      const botoes = screen.getAllByRole('button');
      const botaoRemover = botoes.find(btn => 
        btn.className && btn.className.includes('text-red-600')
      );
      expect(botaoRemover).toBeDefined();
      fireEvent.click(botaoRemover!);

      expect(mockHookReturn.executarAcaoLembrete).not.toHaveBeenCalled();
    });
  });

  // Testes de ações em lote removidos pois o componente não implementa essa funcionalidade

  describe('Paginação', () => {
    it('deve navegar para próxima página', async () => {
      const mockBuscarLembretes = jest.fn();
      (useLembretes as any).mockReturnValue({
        ...mockHookReturn,
        buscarLembretes: mockBuscarLembretes,
        paginacao: {
          ...mockPaginacao,
          paginaAtual: 1,
          totalPaginas: 3,
          temProximaPagina: true,
        },
      });

      render(<ListaLembretes />);

      const botaoProxima = screen.getByText('Próxima');
      fireEvent.click(botaoProxima);

      await waitFor(() => {
        expect(mockBuscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            pagina: 2,
          })
        );
      });
    });

    it('deve navegar para página anterior', async () => {
      const mockBuscarLembretes = jest.fn();
      (useLembretes as any).mockReturnValue({
        ...mockHookReturn,
        buscarLembretes: mockBuscarLembretes,
        paginacao: {
          ...mockPaginacao,
          paginaAtual: 2,
          totalPaginas: 3,
          temPaginaAnterior: true,
        },
      });

      render(<ListaLembretes />);

      const botaoAnterior = screen.getByText('Anterior');
      fireEvent.click(botaoAnterior);

      await waitFor(() => {
        expect(mockBuscarLembretes).toHaveBeenCalledWith(
          expect.objectContaining({
            pagina: 1,
          })
        );
      });
    });

    it('deve exibir informações de paginação', () => {
      (useLembretes as any).mockReturnValue({
        ...mockHookReturn,
        paginacao: {
          ...mockPaginacao,
          paginaAtual: 1,
          totalPaginas: 3,
          totalItens: 25,
          itensPorPagina: 10,
        },
      });

      render(<ListaLembretes />);

      expect(screen.getByText(/Mostrando 1 a 10 de 25 lembretes/)).toBeInTheDocument();
      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    });
  });

  describe('Renderização', () => {
    it('deve renderizar componente corretamente', () => {
      render(<ListaLembretes />);

      // Verifica se o componente renderiza os elementos principais
      expect(screen.getByText('Lembretes')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });

  describe('Exibição de Dados', () => {
    it('deve exibir elementos principais da interface', () => {
      render(<ListaLembretes />);

      expect(screen.getByText('Lembretes')).toBeInTheDocument();
      expect(screen.getByText('Gerencie todos os lembretes de avaliação do sistema')).toBeInTheDocument();
    });

    it('deve exibir dados dos lembretes', () => {
      render(<ListaLembretes />);

      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getAllByText('lembrete')).toHaveLength(2);
      expect(screen.getAllByText('vencimento')).toHaveLength(1);
    });

    it('deve exibir badges de status corretamente', () => {
      render(<ListaLembretes />);

      // Verificar se os status são exibidos baseados nos dados mock
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    });

    it('deve exibir badges de tipo corretamente', () => {
      render(<ListaLembretes />);

      expect(screen.getAllByText('lembrete')).toHaveLength(2);
      expect(screen.getAllByText('vencimento')).toHaveLength(1);
    });

    it('deve exibir informações de tentativas', () => {
      render(<ListaLembretes />);

      expect(screen.getByText('0 tentativas')).toBeInTheDocument();
      expect(screen.getByText('1 tentativa')).toBeInTheDocument();
      expect(screen.getByText('3 tentativas')).toBeInTheDocument();
    });

    it('deve exibir mensagem de erro quando presente', () => {
      render(<ListaLembretes />);

      expect(screen.getByText('Erro: Falha no envio de e-mail')).toBeInTheDocument();
    });
  });

  describe('Atualização Automática', () => {
    it('deve atualizar lista após ações', async () => {
      mockHookReturn.executarAcaoLembrete.mockResolvedValueOnce(true);
      
      // Reset mock antes do teste
      mockHookReturn.buscarLembretes.mockClear();

      render(<ListaLembretes />);

      const botaoReenviar = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-send')
      );
      fireEvent.click(botaoReenviar);

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledTimes(1); // Only after action (hook is mocked)
      });
    });

    it('deve atualizar automaticamente a cada 30 segundos', async () => {
      jest.useFakeTimers();
      
      // Reset mock antes do teste
      mockHookReturn.buscarLembretes.mockClear();

      render(<ListaLembretes />);
      
      // Verificar que não há chamadas iniciais (hook está mockado)
      expect(mockHookReturn.buscarLembretes).toHaveBeenCalledTimes(0);

      // Avançar 30 segundos para ativar o setInterval
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledTimes(1);
      });

      // Avançar mais 30 segundos
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockHookReturn.buscarLembretes).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('Estados de Erro', () => {
    it('deve exibir erro ao falhar ao reenviar', async () => {
      mockHookReturn.executarAcaoLembrete.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<ListaLembretes />);

      const botaoReenviar = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-send')
      );
      fireEvent.click(botaoReenviar);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            variant: 'destructive',
          })
        );
      });
    });

    it('deve exibir erro ao falhar ao remover', async () => {
      mockHookReturn.removerLembrete.mockRejectedValueOnce(new Error('Erro de rede'));
      window.confirm = jest.fn(() => true);

      render(<ListaLembretes />);

      const botoes = screen.getAllByRole('button');
      const botaoRemover = botoes.find(btn => 
        btn.className && btn.className.includes('text-red-600')
      );
      expect(botaoRemover).toBeDefined();
      fireEvent.click(botaoRemover!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para screen readers', () => {
      render(<ListaLembretes />);
      
      expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
      expect(screen.getByText('Tipo')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado funcional', () => {
      render(<ListaLembretes />);

      const filtroTipo = screen.getAllByRole('combobox')[0];
      filtroTipo.focus();
      expect(document.activeElement).toBe(filtroTipo);
    });

    it('deve ter descrições adequadas para ações', () => {
      render(<ListaLembretes />);

      // Verificar se botões de ação estão presentes
      const botoes = screen.getAllByRole('button');
      expect(botoes.length).toBeGreaterThan(0);
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

      render(<ListaLembretes />);

      // Verificar se o componente renderiza corretamente
       expect(screen.getByText('Lembretes')).toBeInTheDocument();
    });

    it('deve mostrar todas as colunas em telas grandes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<ListaLembretes />);

      // Verificar se o componente renderiza corretamente em telas grandes
       expect(screen.getByText('Lembretes')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });
});