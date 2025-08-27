import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PainelAgendamento } from '../../lembretes/painel-agendamento';
import { useAgendadorLembretes } from '../../../hooks/use-agendador-lembretes';
import { useToast } from '../../../hooks/use-toast';

// Mock dos hooks
jest.mock('../../../hooks/use-agendador-lembretes');
jest.mock('../../../hooks/use-toast');

// Mock das configurações de teste
const mockConfiguracoes = {
  id: '1',
  ativo: true,
  intervaloVerificacao: 60,
  horariosVerificacao: ['09:00', '14:00', '18:00'],
  diasAntecedencia: {
    aviso: 3,
    urgente: 1,
    critico: 0,
  },
  tiposNotificacao: {
    email: true,
    sistema: true,
    push: false,
  },
  filtros: {
    apenasAtivos: true,
    ignorarFinsDeSemanaSemana: false,
    ignorarFeriados: false,
  },
  configuracaoEmail: {
    remetente: 'sistema@empresa.com',
    assunto: 'Lembrete de Avaliação',
    template: 'default',
  },
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const mockStatus = {
  ativo: true,
  ultimaVerificacao: new Date().toISOString(),
  proximaVerificacao: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  lembretesPendentes: 5,
  erros: [],
};

const mockEstatisticas = {
  totalLembretes: 25,
  lembretesPendentes: 5,
  lembretesEnviados: 15,
  lembretesFalharam: 2,
  lembretesReagendados: 3,
  porTipo: {
    aviso: 10,
    urgente: 8,
    critico: 7,
  },
  porStatus: {
    pendente: 5,
    enviado: 15,
    falhou: 2,
    reagendado: 3,
  },
  ultimosPeriodos: {
    hoje: 3,
    ontem: 5,
    ultimaSemana: 18,
    ultimoMes: 25,
  },
};

const mockHookReturn = {
  configuracoes: mockConfiguracoes,
  status: mockStatus,
  estatisticas: mockEstatisticas,
  carregando: false,
  erro: null,
  buscarConfiguracoes: jest.fn(),
  atualizarConfiguracoes: jest.fn(),
  buscarStatus: jest.fn(),
  buscarEstatisticas: jest.fn(),
  iniciarAgendador: jest.fn(),
  pararAgendador: jest.fn(),
  forcarVerificacao: jest.fn(),
  limparLembretesPendentes: jest.fn(),
  resetarConfiguracao: jest.fn(),
};

const mockToast = jest.fn();

describe('PainelAgendamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAgendadorLembretes as any).mockReturnValue(mockHookReturn);
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar painel de agendamento', () => {
      render(<PainelAgendamento />);

      expect(screen.getByText('Agendamento de Lembretes')).toBeInTheDocument();
      expect(screen.getByText('Status do Agendador')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
      expect(screen.getByText('Estatísticas')).toBeInTheDocument();
    });

    it('deve exibir estado de carregamento', () => {
      (useAgendadorLembretes as any).mockReturnValue({
        ...mockHookReturn,
        carregando: true,
        configuracoes: null,
        status: null,
        estatisticas: null,
      });

      render(<PainelAgendamento />);

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve exibir erro quando houver falha', () => {
      const errorMessage = 'Erro ao carregar dados';
      (useAgendadorLembretes as any).mockReturnValue({
        ...mockHookReturn,
        erro: errorMessage,
        configuracoes: null,
      });

      render(<PainelAgendamento />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Status do Agendador', () => {
    it('deve exibir status ativo', () => {
      render(<PainelAgendamento />);

      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('5 lembretes pendentes')).toBeInTheDocument();
    });

    it('deve exibir status inativo', () => {
      (useAgendadorLembretes as any).mockReturnValue({
        ...mockHookReturn,
        status: {
          ...mockStatus,
          ativo: false,
        },
      });

      render(<PainelAgendamento />);

      expect(screen.getByText('Inativo')).toBeInTheDocument();
    });

    it('deve iniciar agendador', async () => {
      (useAgendadorLembretes as any).mockReturnValue({
        ...mockHookReturn,
        status: {
          ...mockStatus,
          ativo: false,
        },
      });

      mockHookReturn.iniciarAgendador.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const botaoIniciar = screen.getByText('Iniciar Agendador');
      fireEvent.click(botaoIniciar);

      await waitFor(() => {
        expect(mockHookReturn.iniciarAgendador).toHaveBeenCalled();
      });
    });

    it('deve parar agendador', async () => {
      mockHookReturn.pararAgendador.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const botaoParar = screen.getByText('Parar Agendador');
      fireEvent.click(botaoParar);

      await waitFor(() => {
        expect(mockHookReturn.pararAgendador).toHaveBeenCalled();
      });
    });

    it('deve forçar verificação', async () => {
      mockHookReturn.forcarVerificacao.mockResolvedValueOnce({ processados: 3 });

      render(<PainelAgendamento />);

      const botaoForcar = screen.getByText('Forçar Verificação');
      fireEvent.click(botaoForcar);

      await waitFor(() => {
        expect(mockHookReturn.forcarVerificacao).toHaveBeenCalled();
      });
    });

    it('deve limpar lembretes pendentes', async () => {
      mockHookReturn.limparLembretesPendentes.mockResolvedValueOnce({ removidos: 5 });
      window.confirm = jest.fn(() => true);

      render(<PainelAgendamento />);

      const botaoLimpar = screen.getByText('Limpar Pendentes');
      fireEvent.click(botaoLimpar);

      await waitFor(() => {
        expect(mockHookReturn.limparLembretesPendentes).toHaveBeenCalled();
      });
    });

    it('deve cancelar limpeza se usuário não confirmar', async () => {
      window.confirm = jest.fn(() => false);

      render(<PainelAgendamento />);

      const botaoLimpar = screen.getByText('Limpar Pendentes');
      fireEvent.click(botaoLimpar);

      expect(mockHookReturn.limparLembretesPendentes).not.toHaveBeenCalled();
    });
  });

  describe('Configurações', () => {
    it('deve alterar ativação do agendador', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const switchAtivo = screen.getByLabelText('Ativar agendador');
      fireEvent.click(switchAtivo);

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            ativo: false, // Era true, agora false
          })
        );
      });
    });

    it('deve alterar intervalo de verificação', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const inputIntervalo = screen.getByLabelText('Intervalo de verificação (minutos)');
      fireEvent.change(inputIntervalo, { target: { value: '30' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            intervaloVerificacao: 30,
          })
        );
      });
    });

    it('deve alterar horários de verificação', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const inputHorarios = screen.getByLabelText('Horários de verificação');
      fireEvent.change(inputHorarios, { target: { value: '08:00,12:00,16:00,20:00' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            horariosVerificacao: ['08:00', '12:00', '16:00', '20:00'],
          })
        );
      });
    });

    it('deve alterar dias de antecedência', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const inputAviso = screen.getByLabelText('Dias para aviso');
      fireEvent.change(inputAviso, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            diasAntecedencia: expect.objectContaining({
              aviso: 5,
            }),
          })
        );
      });
    });

    it('deve alterar tipos de notificação', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const switchEmail = screen.getByLabelText('Notificação por e-mail');
      fireEvent.click(switchEmail);

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            tiposNotificacao: expect.objectContaining({
              email: false, // Era true, agora false
            }),
          })
        );
      });
    });

    it('deve alterar filtros', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const switchAtivos = screen.getByLabelText('Apenas usuários ativos');
      fireEvent.click(switchAtivos);

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            filtros: expect.objectContaining({
              apenasAtivos: false, // Era true, agora false
            }),
          })
        );
      });
    });

    it('deve alterar configuração de e-mail', async () => {
      mockHookReturn.atualizarConfiguracoes.mockResolvedValueOnce(true);

      render(<PainelAgendamento />);

      const inputRemetente = screen.getByLabelText('E-mail remetente');
      fireEvent.change(inputRemetente, { target: { value: 'novo@empresa.com' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarConfiguracoes).toHaveBeenCalledWith(
          expect.objectContaining({
            configuracaoEmail: expect.objectContaining({
              remetente: 'novo@empresa.com',
            }),
          })
        );
      });
    });

    it('deve resetar configurações', async () => {
      mockHookReturn.resetarConfiguracao.mockResolvedValueOnce(true);
      window.confirm = jest.fn(() => true);

      render(<PainelAgendamento />);

      const botaoReset = screen.getByText('Restaurar Padrões');
      fireEvent.click(botaoReset);

      await waitFor(() => {
        expect(mockHookReturn.resetarConfiguracao).toHaveBeenCalled();
      });
    });
  });

  describe('Estatísticas', () => {
    it('deve exibir estatísticas gerais', () => {
      render(<PainelAgendamento />);

      expect(screen.getByText('25')).toBeInTheDocument(); // Total
      expect(screen.getByText('5')).toBeInTheDocument(); // Pendentes
      expect(screen.getByText('15')).toBeInTheDocument(); // Enviados
      expect(screen.getByText('2')).toBeInTheDocument(); // Falharam
    });

    it('deve exibir estatísticas por tipo', () => {
      render(<PainelAgendamento />);

      expect(screen.getByText('10')).toBeInTheDocument(); // Aviso
      expect(screen.getByText('8')).toBeInTheDocument(); // Urgente
      expect(screen.getByText('7')).toBeInTheDocument(); // Crítico
    });

    it('deve exibir estatísticas por período', () => {
      render(<PainelAgendamento />);

      expect(screen.getByText('3')).toBeInTheDocument(); // Hoje
      expect(screen.getByText('18')).toBeInTheDocument(); // Última semana
    });

    it('deve atualizar estatísticas', async () => {
      render(<PainelAgendamento />);

      const botaoAtualizar = screen.getByText('Atualizar Estatísticas');
      fireEvent.click(botaoAtualizar);

      await waitFor(() => {
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalled();
      });
    });
  });

  describe('Filtros de Estatísticas', () => {
    it('deve aplicar filtro por período', async () => {
      render(<PainelAgendamento />);

      const seletorPeriodo = screen.getByLabelText('Período');
      fireEvent.change(seletorPeriodo, { target: { value: 'ultima_semana' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledWith(
          expect.objectContaining({
            periodo: 'ultima_semana',
          })
        );
      });
    });

    it('deve aplicar filtro por tipo', async () => {
      render(<PainelAgendamento />);

      const seletorTipo = screen.getByLabelText('Tipo de lembrete');
      fireEvent.change(seletorTipo, { target: { value: 'urgente' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledWith(
          expect.objectContaining({
            tipo: 'urgente',
          })
        );
      });
    });

    it('deve aplicar filtro por status', async () => {
      render(<PainelAgendamento />);

      const seletorStatus = screen.getByLabelText('Status');
      fireEvent.change(seletorStatus, { target: { value: 'enviado' } });

      await waitFor(() => {
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'enviado',
          })
        );
      });
    });

    it('deve limpar filtros', async () => {
      render(<PainelAgendamento />);

      // Aplicar filtros primeiro
      const seletorPeriodo = screen.getByLabelText('Período');
      fireEvent.change(seletorPeriodo, { target: { value: 'ultima_semana' } });

      // Limpar filtros
      const botaoLimpar = screen.getByText('Limpar Filtros');
      fireEvent.click(botaoLimpar);

      await waitFor(() => {
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Validações', () => {
    it('deve validar intervalo de verificação mínimo', async () => {
      render(<PainelAgendamento />);

      const inputIntervalo = screen.getByLabelText('Intervalo de verificação (minutos)');
      fireEvent.change(inputIntervalo, { target: { value: '0' } });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            description: 'Intervalo deve ser maior que 0',
            variant: 'destructive',
          })
        );
      });
    });

    it('deve validar formato de horários', async () => {
      render(<PainelAgendamento />);

      const inputHorarios = screen.getByLabelText('Horários de verificação');
      fireEvent.change(inputHorarios, { target: { value: '25:00,invalid' } });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            description: expect.stringContaining('Formato de horário inválido'),
            variant: 'destructive',
          })
        );
      });
    });

    it('deve validar e-mail remetente', async () => {
      render(<PainelAgendamento />);

      const inputRemetente = screen.getByLabelText('E-mail remetente');
      fireEvent.change(inputRemetente, { target: { value: 'email-invalido' } });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            description: 'E-mail inválido',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Estados de Erro', () => {
    it('deve exibir erro ao falhar ao atualizar configurações', async () => {
      mockHookReturn.atualizarConfiguracoes.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<PainelAgendamento />);

      const switchAtivo = screen.getByLabelText('Ativar agendador');
      fireEvent.click(switchAtivo);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            variant: 'destructive',
          })
        );
      });
    });

    it('deve exibir erro ao falhar ao iniciar agendador', async () => {
      (useAgendadorLembretes as any).mockReturnValue({
        ...mockHookReturn,
        status: {
          ...mockStatus,
          ativo: false,
        },
      });

      mockHookReturn.iniciarAgendador.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<PainelAgendamento />);

      const botaoIniciar = screen.getByText('Iniciar Agendador');
      fireEvent.click(botaoIniciar);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            variant: 'destructive',
          })
        );
      });
    });

    it('deve exibir erro ao falhar ao forçar verificação', async () => {
      mockHookReturn.forcarVerificacao.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<PainelAgendamento />);

      const botaoForcar = screen.getByText('Forçar Verificação');
      fireEvent.click(botaoForcar);

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
      render(<PainelAgendamento />);

      expect(screen.getByLabelText('Ativar agendador')).toBeInTheDocument();
      expect(screen.getByLabelText('Intervalo de verificação (minutos)')).toBeInTheDocument();
      expect(screen.getByLabelText('Horários de verificação')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado funcional', () => {
      render(<PainelAgendamento />);

      const switchAtivo = screen.getByLabelText('Ativar agendador');
      switchAtivo.focus();
      expect(document.activeElement).toBe(switchAtivo);
    });

    it('deve ter descrições adequadas para campos complexos', () => {
      render(<PainelAgendamento />);

      expect(screen.getByText(/Configurações do agendador automático/)).toBeInTheDocument();
    });
  });

  describe('Atualização Automática', () => {
    it('deve atualizar dados após ações', async () => {
      mockHookReturn.iniciarAgendador.mockResolvedValueOnce(true);

      (useAgendadorLembretes as any).mockReturnValue({
        ...mockHookReturn,
        status: {
          ...mockStatus,
          ativo: false,
        },
      });

      render(<PainelAgendamento />);

      const botaoIniciar = screen.getByText('Iniciar Agendador');
      fireEvent.click(botaoIniciar);

      await waitFor(() => {
        expect(mockHookReturn.buscarStatus).toHaveBeenCalledTimes(2); // Initial + after action
        expect(mockHookReturn.buscarEstatisticas).toHaveBeenCalledTimes(2);
      });
    });
  });
});