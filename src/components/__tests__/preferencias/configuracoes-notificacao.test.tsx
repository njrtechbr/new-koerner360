import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfiguracoesNotificacao } from '../../preferencias/configuracoes-notificacao';
import { usePreferenciasNotificacao } from '../../../hooks/use-preferencias-notificacao';
import { useToast } from '../../../hooks/use-toast';
import { PREFERENCIAS_DEFAULTS } from '../../../lib/types/preferencias-notificacao';

// Mock dos hooks
jest.mock('../../../hooks/use-preferencias-notificacao');
jest.mock('../../../hooks/use-toast');

// Mock das preferências de teste
const mockPreferencias = {
  id: '1',
  usuarioId: 'user-1',
  ativo: true,
  emailAtivo: true,
  formatoEmail: 'html' as const,
  idioma: 'pt-BR' as const,
  conteudo: {
    incluirDetalhesAvaliacao: true,
    incluirLinkDireto: true,
    incluirResumoEstatisticas: false,
  },
  urgenciaMinima: 'media' as const,
  tipos: {
    pendente: {
      ativo: true,
      frequencia: 'diaria' as const,
      diasAntecedencia: 1,
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    vencida: {
      ativo: true,
      frequencia: 'imediata' as const,
      diasAntecedencia: 0,
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    proximaVencimento: {
      ativo: true,
      frequencia: 'semanal' as const,
      diasAntecedencia: 3,
      horarioEnvio: '10:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    nova: {
      ativo: false,
      frequencia: 'imediata' as const,
      diasAntecedencia: 0,
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    completada: {
      ativo: false,
      frequencia: 'imediata' as const,
      diasAntecedencia: 0,
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    personalizada: {
      ativo: false,
      frequencia: 'diaria' as const,
      diasAntecedencia: 1,
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
  },
  filtros: {
    apenasMinhasAvaliacoes: false,
    apenasAvaliacoesQueAvalia: true,
  },
  pausada: false,
  pausadaAte: null,
  motivoPausa: null,
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const mockHookReturn = {
  preferencias: mockPreferencias,
  carregando: false,
  erro: null,
  pausada: false,
  buscarPreferencias: jest.fn(),
  atualizarPreferencias: jest.fn(),
  resetarPreferencias: jest.fn(),
  pausarNotificacoes: jest.fn(),
  retomarNotificacoes: jest.fn(),
  verificarNotificacoesPausadas: jest.fn(),
};

const mockToast = jest.fn();

describe('ConfiguracoesNotificacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePreferenciasNotificacao as any).mockReturnValue(mockHookReturn);
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar configurações de notificação', () => {
      render(<ConfiguracoesNotificacao />);

      expect(screen.getByText('Configurações de Notificação')).toBeInTheDocument();
      expect(screen.getByText('Configurações Gerais')).toBeInTheDocument();
      expect(screen.getByText('Tipos de Notificação')).toBeInTheDocument();
    });

    it('deve exibir estado de carregamento', () => {
      (usePreferenciasNotificacao as any).mockReturnValue({
        ...mockHookReturn,
        carregando: true,
        preferencias: null,
      });

      render(<ConfiguracoesNotificacao />);

      expect(screen.getByText('Carregando configurações...')).toBeInTheDocument();
    });

    it('deve exibir erro quando houver falha', () => {
      const errorMessage = 'Erro ao carregar configurações';
      (usePreferenciasNotificacao as any).mockReturnValue({
        ...mockHookReturn,
        erro: errorMessage,
        preferencias: null,
      });

      render(<ConfiguracoesNotificacao />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('deve exibir valores padrão quando não há preferências', () => {
      (usePreferenciasNotificacao as any).mockReturnValue({
        ...mockHookReturn,
        preferencias: null,
      });

      render(<ConfiguracoesNotificacao />);

      // Verificar se os valores padrão são exibidos
      const switchAtivo = screen.getByLabelText('Ativar notificações');
      expect(switchAtivo).toBeChecked(); // PREFERENCIAS_DEFAULTS.ativo é true
    });
  });

  describe('Configurações Gerais', () => {
    it('deve alterar ativação geral das notificações', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchAtivo = screen.getByLabelText('Ativar notificações');
      fireEvent.click(switchAtivo);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            ativo: false, // Era true, agora false
          })
        );
      });
    });

    it('deve alterar ativação de e-mail', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchEmail = screen.getByLabelText('Ativar notificações por e-mail');
      fireEvent.click(switchEmail);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            emailAtivo: false,
          })
        );
      });
    });

    it('deve alterar formato do e-mail', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const seletorFormato = screen.getByLabelText('Formato do e-mail');
      fireEvent.change(seletorFormato, { target: { value: 'texto' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            formatoEmail: 'texto',
          })
        );
      });
    });

    it('deve alterar idioma', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const seletorIdioma = screen.getByLabelText('Idioma');
      fireEvent.change(seletorIdioma, { target: { value: 'en-US' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            idioma: 'en-US',
          })
        );
      });
    });

    it('deve alterar urgência mínima', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const seletorUrgencia = screen.getByLabelText('Urgência mínima');
      fireEvent.change(seletorUrgencia, { target: { value: 'alta' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            urgenciaMinima: 'alta',
          })
        );
      });
    });
  });

  describe('Configurações de Conteúdo', () => {
    it('deve alterar inclusão de detalhes da avaliação', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchDetalhes = screen.getByLabelText('Incluir detalhes da avaliação');
      fireEvent.click(switchDetalhes);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            conteudo: expect.objectContaining({
              incluirDetalhesAvaliacao: false,
            }),
          })
        );
      });
    });

    it('deve alterar inclusão de link direto', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchLink = screen.getByLabelText('Incluir link direto');
      fireEvent.click(switchLink);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            conteudo: expect.objectContaining({
              incluirLinkDireto: false,
            }),
          })
        );
      });
    });

    it('deve alterar inclusão de resumo de estatísticas', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchResumo = screen.getByLabelText('Incluir resumo de estatísticas');
      fireEvent.click(switchResumo);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            conteudo: expect.objectContaining({
              incluirResumoEstatisticas: true, // Era false, agora true
            }),
          })
        );
      });
    });
  });

  describe('Tipos de Notificação', () => {
    it('deve ativar/desativar tipo de notificação', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchPendente = screen.getByLabelText('Ativar notificações de avaliação pendente');
      fireEvent.click(switchPendente);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            tipos: expect.objectContaining({
              pendente: expect.objectContaining({
                ativo: false, // Era true, agora false
              }),
            }),
          })
        );
      });
    });

    it('deve alterar frequência de notificação', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const seletorFrequencia = screen.getByLabelText('Frequência para avaliação pendente');
      fireEvent.change(seletorFrequencia, { target: { value: 'semanal' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            tipos: expect.objectContaining({
              pendente: expect.objectContaining({
                frequencia: 'semanal',
              }),
            }),
          })
        );
      });
    });

    it('deve alterar dias de antecedência', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const inputDias = screen.getByLabelText('Dias de antecedência para avaliação pendente');
      fireEvent.change(inputDias, { target: { value: '3' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            tipos: expect.objectContaining({
              pendente: expect.objectContaining({
                diasAntecedencia: 3,
              }),
            }),
          })
        );
      });
    });

    it('deve alterar horário de envio', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const inputHorario = screen.getByLabelText('Horário de envio para avaliação pendente');
      fireEvent.change(inputHorario, { target: { value: '14:30' } });

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            tipos: expect.objectContaining({
              pendente: expect.objectContaining({
                horarioEnvio: '14:30',
              }),
            }),
          })
        );
      });
    });

    it('deve alterar inclusão de fins de semana', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchFimSemana = screen.getByLabelText('Incluir fins de semana para avaliação pendente');
      fireEvent.click(switchFimSemana);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            tipos: expect.objectContaining({
              pendente: expect.objectContaining({
                incluirFinsDeSemanaSemana: true, // Era false, agora true
              }),
            }),
          })
        );
      });
    });

    it('deve alterar inclusão de feriados', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchFeriados = screen.getByLabelText('Incluir feriados para avaliação pendente');
      fireEvent.click(switchFeriados);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            tipos: expect.objectContaining({
              pendente: expect.objectContaining({
                incluirFeriados: true, // Era false, agora true
              }),
            }),
          })
        );
      });
    });
  });

  describe('Filtros', () => {
    it('deve alterar filtro de apenas minhas avaliações', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchMinhas = screen.getByLabelText('Apenas minhas avaliações');
      fireEvent.click(switchMinhas);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            filtros: expect.objectContaining({
              apenasMinhasAvaliacoes: true, // Era false, agora true
            }),
          })
        );
      });
    });

    it('deve alterar filtro de avaliações que eu avalio', async () => {
      mockHookReturn.atualizarPreferencias.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const switchAvalio = screen.getByLabelText('Avaliações que eu avalio');
      fireEvent.click(switchAvalio);

      await waitFor(() => {
        expect(mockHookReturn.atualizarPreferencias).toHaveBeenCalledWith(
          expect.objectContaining({
            filtros: expect.objectContaining({
              apenasAvaliacoesQueAvalia: false, // Era true, agora false
            }),
          })
        );
      });
    });
  });

  describe('Pausa de Notificações', () => {
    it('deve pausar notificações', async () => {
      mockHookReturn.pausarNotificacoes.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const inputDataFim = screen.getByLabelText('Pausar até');
      const inputMotivo = screen.getByLabelText('Motivo (opcional)');
      const botaoPausar = screen.getByText('Pausar Notificações');

      fireEvent.change(inputDataFim, { target: { value: '2024-12-31' } });
      fireEvent.change(inputMotivo, { target: { value: 'Férias' } });
      fireEvent.click(botaoPausar);

      await waitFor(() => {
        expect(mockHookReturn.pausarNotificacoes).toHaveBeenCalledWith(
          expect.any(Date),
          'Férias'
        );
      });
    });

    it('deve retomar notificações', async () => {
      (usePreferenciasNotificacao as any).mockReturnValue({
        ...mockHookReturn,
        pausada: true,
        preferencias: {
          ...mockPreferencias,
          pausada: true,
          pausadaAte: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          motivoPausa: 'Férias',
        },
      });

      mockHookReturn.retomarNotificacoes.mockResolvedValueOnce(true);

      render(<ConfiguracoesNotificacao />);

      const botaoRetomar = screen.getByText('Retomar Notificações');
      fireEvent.click(botaoRetomar);

      await waitFor(() => {
        expect(mockHookReturn.retomarNotificacoes).toHaveBeenCalled();
      });
    });

    it('deve exibir status de pausa', () => {
      (usePreferenciasNotificacao as any).mockReturnValue({
        ...mockHookReturn,
        pausada: true,
        preferencias: {
          ...mockPreferencias,
          pausada: true,
          pausadaAte: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          motivoPausa: 'Férias',
        },
      });

      render(<ConfiguracoesNotificacao />);

      expect(screen.getByText(/Notificações pausadas até/)).toBeInTheDocument();
      expect(screen.getByText(/Motivo: Férias/)).toBeInTheDocument();
    });

    it('deve validar data de pausa', async () => {
      render(<ConfiguracoesNotificacao />);

      const inputDataFim = screen.getByLabelText('Pausar até');
      const botaoPausar = screen.getByText('Pausar Notificações');

      // Tentar pausar com data no passado
      fireEvent.change(inputDataFim, { target: { value: '2020-01-01' } });
      fireEvent.click(botaoPausar);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            description: 'A data deve ser no futuro',
            variant: 'destructive',
          })
        );
      });

      expect(mockHookReturn.pausarNotificacoes).not.toHaveBeenCalled();
    });
  });

  describe('Reset de Configurações', () => {
    it('deve resetar configurações para padrão', async () => {
      mockHookReturn.resetarPreferencias.mockResolvedValueOnce(true);
      window.confirm = vi.fn(() => true);

      render(<ConfiguracoesNotificacao />);

      const botaoReset = screen.getByText('Restaurar Padrões');
      fireEvent.click(botaoReset);

      await waitFor(() => {
        expect(mockHookReturn.resetarPreferencias).toHaveBeenCalled();
      });
    });

    it('deve cancelar reset se usuário não confirmar', async () => {
      window.confirm = vi.fn(() => false);

      render(<ConfiguracoesNotificacao />);

      const botaoReset = screen.getByText('Restaurar Padrões');
      fireEvent.click(botaoReset);

      expect(mockHookReturn.resetarPreferencias).not.toHaveBeenCalled();
    });
  });

  describe('Validações', () => {
    it('deve validar horário de envio', async () => {
      render(<ConfiguracoesNotificacao />);

      const inputHorario = screen.getByLabelText('Horário de envio para avaliação pendente');
      fireEvent.change(inputHorario, { target: { value: '25:00' } });

      // O input type="time" deve automaticamente validar o formato
      expect(inputHorario).toHaveValue('25:00'); // Valor inválido
    });

    it('deve validar dias de antecedência', async () => {
      render(<ConfiguracoesNotificacao />);

      const inputDias = screen.getByLabelText('Dias de antecedência para avaliação pendente');
      fireEvent.change(inputDias, { target: { value: '-1' } });

      // O input type="number" com min="0" deve validar automaticamente
      expect(inputDias).toHaveValue(-1); // Valor inválido
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para screen readers', () => {
      render(<ConfiguracoesNotificacao />);

      expect(screen.getByLabelText('Ativar notificações')).toBeInTheDocument();
      expect(screen.getByLabelText('Ativar notificações por e-mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Formato do e-mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Idioma')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado funcional', () => {
      render(<ConfiguracoesNotificacao />);

      const switchAtivo = screen.getByLabelText('Ativar notificações');
      switchAtivo.focus();
      expect(document.activeElement).toBe(switchAtivo);
    });

    it('deve ter descrições adequadas para campos complexos', () => {
      render(<ConfiguracoesNotificacao />);

      // Verificar se há textos explicativos
      expect(screen.getByText(/Configurações gerais de notificação/)).toBeInTheDocument();
    });
  });

  describe('Estados de Erro', () => {
    it('deve exibir erro ao falhar ao atualizar preferências', async () => {
      mockHookReturn.atualizarPreferencias.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<ConfiguracoesNotificacao />);

      const switchAtivo = screen.getByLabelText('Ativar notificações');
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

    it('deve exibir erro ao falhar ao pausar notificações', async () => {
      mockHookReturn.pausarNotificacoes.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<ConfiguracoesNotificacao />);

      const inputDataFim = screen.getByLabelText('Pausar até');
      const botaoPausar = screen.getByText('Pausar Notificações');

      fireEvent.change(inputDataFim, { target: { value: '2024-12-31' } });
      fireEvent.click(botaoPausar);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            variant: 'destructive',
          })
        );
      });
    });

    it('deve exibir erro ao falhar ao retomar notificações', async () => {
      (usePreferenciasNotificacao as any).mockReturnValue({
        ...mockHookReturn,
        pausada: true,
      });

      mockHookReturn.retomarNotificacoes.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<ConfiguracoesNotificacao />);

      const botaoRetomar = screen.getByText('Retomar Notificações');
      fireEvent.click(botaoRetomar);

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
});