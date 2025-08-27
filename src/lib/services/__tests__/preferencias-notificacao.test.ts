import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PreferenciasNotificacaoService } from '../preferencias-notificacao';
import { TipoNotificacao, UrgenciaNotificacao } from '../../types/notificacao';

// Mock do Prisma
const mockPrisma = {
  preferenciasNotificacao: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  pausaNotificacao: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Dados de teste
const mockPreferencias = {
  id: 'pref1',
  usuarioId: 'user1',
  ativo: true,
  notificacaoEmail: true,
  formatoEmail: 'html' as const,
  idioma: 'pt-BR',
  conteudo: {
    incluirDetalhesAvaliacao: true,
    incluirLinkDireto: true,
    incluirResumoEstatisticas: false,
  },
  urgenciaMinima: 'media' as UrgenciaNotificacao,
  tiposNotificacao: {
    pendente: {
      ativo: true,
      frequencia: 'diaria',
      diasAntecedencia: [7, 3, 1],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    vencida: {
      ativo: true,
      frequencia: 'imediata',
      diasAntecedencia: [0],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    proximaVencimento: {
      ativo: true,
      frequencia: 'semanal',
      diasAntecedencia: [7, 3],
      horarioEnvio: '14:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    nova: {
      ativo: false,
      frequencia: 'imediata',
      diasAntecedencia: [0],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    completada: {
      ativo: false,
      frequencia: 'imediata',
      diasAntecedencia: [0],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    personalizada: {
      ativo: false,
      frequencia: 'personalizada',
      diasAntecedencia: [],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
  },
  filtros: {
    avaliacoesUsuario: true,
    avaliacoesQueAvalia: true,
  },
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const mockPausa = {
  id: 'pausa1',
  usuarioId: 'user1',
  ativo: true,
  dataInicio: new Date().toISOString(),
  dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  motivo: 'Férias',
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const mockPreferenciasPadrao = {
  ativo: true,
  notificacaoEmail: true,
  formatoEmail: 'html' as const,
  idioma: 'pt-BR',
  conteudo: {
    incluirDetalhesAvaliacao: true,
    incluirLinkDireto: true,
    incluirResumoEstatisticas: false,
  },
  urgenciaMinima: 'baixa' as UrgenciaNotificacao,
  tiposNotificacao: {
    pendente: {
      ativo: true,
      frequencia: 'diaria',
      diasAntecedencia: [7, 3, 1],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    vencida: {
      ativo: true,
      frequencia: 'imediata',
      diasAntecedencia: [0],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    proximaVencimento: {
      ativo: true,
      frequencia: 'semanal',
      diasAntecedencia: [7, 3],
      horarioEnvio: '14:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
    nova: {
      ativo: false,
      frequencia: 'imediata',
      diasAntecedencia: [0],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    completada: {
      ativo: false,
      frequencia: 'imediata',
      diasAntecedencia: [0],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: true,
      incluirFeriados: true,
    },
    personalizada: {
      ativo: false,
      frequencia: 'personalizada',
      diasAntecedencia: [],
      horarioEnvio: '09:00',
      incluirFinsDeSemanaSemana: false,
      incluirFeriados: false,
    },
  },
  filtros: {
    avaliacoesUsuario: true,
    avaliacoesQueAvalia: true,
  },
};

describe('PreferenciasNotificacaoService', () => {
  let service: PreferenciasNotificacaoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PreferenciasNotificacaoService(mockPrisma as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarPreferencias', () => {
    it('deve buscar preferências existentes', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(mockPreferencias);

      const resultado = await service.buscarPreferencias('user1');

      expect(mockPrisma.preferenciasNotificacao.findUnique).toHaveBeenCalledWith({
        where: { usuarioId: 'user1' },
      });

      expect(resultado).toEqual(mockPreferencias);
    });

    it('deve retornar preferências padrão se não existir', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(null);

      const resultado = await service.buscarPreferencias('user1');

      expect(resultado).toEqual({
        usuarioId: 'user1',
        ...mockPreferenciasPadrao,
      });
    });

    it('deve tratar erro de banco de dados', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(service.buscarPreferencias('user1')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('atualizarPreferencias', () => {
    it('deve atualizar preferências existentes', async () => {
      const novasPreferencias = {
        ativo: false,
        notificacaoEmail: false,
        urgenciaMinima: 'alta' as UrgenciaNotificacao,
      };

      const preferenciasAtualizadas = {
        ...mockPreferencias,
        ...novasPreferencias,
      };

      mockPrisma.preferenciasNotificacao.upsert.mockResolvedValueOnce(preferenciasAtualizadas);

      const resultado = await service.atualizarPreferencias('user1', novasPreferencias);

      expect(mockPrisma.preferenciasNotificacao.upsert).toHaveBeenCalledWith({
        where: { usuarioId: 'user1' },
        create: {
          usuarioId: 'user1',
          ...mockPreferenciasPadrao,
          ...novasPreferencias,
        },
        update: novasPreferencias,
      });

      expect(resultado.ativo).toBe(false);
      expect(resultado.notificacaoEmail).toBe(false);
      expect(resultado.urgenciaMinima).toBe('alta');
    });

    it('deve criar preferências se não existir', async () => {
      const novasPreferencias = {
        idioma: 'en-US',
        formatoEmail: 'texto' as const,
      };

      const preferenciasCompletas = {
        id: 'pref2',
        usuarioId: 'user2',
        ...mockPreferenciasPadrao,
        ...novasPreferencias,
      };

      mockPrisma.preferenciasNotificacao.upsert.mockResolvedValueOnce(preferenciasCompletas);

      const resultado = await service.atualizarPreferencias('user2', novasPreferencias);

      expect(resultado.idioma).toBe('en-US');
      expect(resultado.formatoEmail).toBe('texto');
    });

    it('deve validar dados de entrada', async () => {
      const preferenciasInvalidas = {
        urgenciaMinima: 'invalida' as any,
      };

      await expect(
        service.atualizarPreferencias('user1', preferenciasInvalidas)
      ).rejects.toThrow('Urgência inválida');
    });

    it('deve validar horários de envio', async () => {
      const preferenciasInvalidas = {
        tiposNotificacao: {
          pendente: {
            horarioEnvio: '25:00', // Horário inválido
          },
        },
      };

      await expect(
        service.atualizarPreferencias('user1', preferenciasInvalidas)
      ).rejects.toThrow('Horário inválido');
    });

    it('deve validar dias de antecedência', async () => {
      const preferenciasInvalidas = {
        tiposNotificacao: {
          pendente: {
            diasAntecedencia: [-1, 0], // Valores inválidos
          },
        },
      };

      await expect(
        service.atualizarPreferencias('user1', preferenciasInvalidas)
      ).rejects.toThrow('Dias de antecedência devem ser positivos');
    });
  });

  describe('resetarPreferencias', () => {
    it('deve resetar preferências para padrões', async () => {
      const preferenciasResetadas = {
        id: 'pref1',
        usuarioId: 'user1',
        ...mockPreferenciasPadrao,
      };

      mockPrisma.preferenciasNotificacao.upsert.mockResolvedValueOnce(preferenciasResetadas);

      const resultado = await service.resetarPreferencias('user1');

      expect(mockPrisma.preferenciasNotificacao.upsert).toHaveBeenCalledWith({
        where: { usuarioId: 'user1' },
        create: {
          usuarioId: 'user1',
          ...mockPreferenciasPadrao,
        },
        update: mockPreferenciasPadrao,
      });

      expect(resultado.ativo).toBe(true);
      expect(resultado.urgenciaMinima).toBe('baixa');
      expect(resultado.tiposNotificacao.pendente.ativo).toBe(true);
    });

    it('deve tratar erro ao resetar', async () => {
      mockPrisma.preferenciasNotificacao.upsert.mockRejectedValueOnce(
        new Error('Reset failed')
      );

      await expect(service.resetarPreferencias('user1')).rejects.toThrow(
        'Reset failed'
      );
    });
  });

  describe('pausarNotificacoes', () => {
    it('deve pausar notificações por período específico', async () => {
      const dataInicio = new Date();
      const dataFim = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const motivo = 'Férias de fim de ano';

      mockPrisma.pausaNotificacao.create.mockResolvedValueOnce({
        ...mockPausa,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        motivo,
      });

      const resultado = await service.pausarNotificacoes(
        'user1',
        dataInicio,
        dataFim,
        motivo
      );

      expect(mockPrisma.pausaNotificacao.create).toHaveBeenCalledWith({
        data: {
          usuarioId: 'user1',
          ativo: true,
          dataInicio,
          dataFim,
          motivo,
        },
      });

      expect(resultado.ativo).toBe(true);
      expect(resultado.motivo).toBe(motivo);
    });

    it('deve pausar notificações indefinidamente', async () => {
      const dataInicio = new Date();
      const motivo = 'Licença médica';

      mockPrisma.pausaNotificacao.create.mockResolvedValueOnce({
        ...mockPausa,
        dataInicio: dataInicio.toISOString(),
        dataFim: null,
        motivo,
      });

      const resultado = await service.pausarNotificacoes(
        'user1',
        dataInicio,
        undefined,
        motivo
      );

      expect(mockPrisma.pausaNotificacao.create).toHaveBeenCalledWith({
        data: {
          usuarioId: 'user1',
          ativo: true,
          dataInicio,
          dataFim: null,
          motivo,
        },
      });

      expect(resultado.dataFim).toBeNull();
    });

    it('deve validar datas de pausa', async () => {
      const dataInicio = new Date();
      const dataFim = new Date(Date.now() - 24 * 60 * 60 * 1000); // Data no passado

      await expect(
        service.pausarNotificacoes('user1', dataInicio, dataFim)
      ).rejects.toThrow('Data fim deve ser posterior à data início');
    });

    it('deve substituir pausa existente', async () => {
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(mockPausa);
      mockPrisma.pausaNotificacao.update.mockResolvedValueOnce({
        ...mockPausa,
        dataFim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        motivo: 'Extensão de férias',
      });

      const dataInicio = new Date();
      const dataFim = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const motivo = 'Extensão de férias';

      const resultado = await service.pausarNotificacoes(
        'user1',
        dataInicio,
        dataFim,
        motivo
      );

      expect(mockPrisma.pausaNotificacao.update).toHaveBeenCalledWith({
        where: { id: mockPausa.id },
        data: {
          dataInicio,
          dataFim,
          motivo,
          ativo: true,
        },
      });

      expect(resultado.motivo).toBe('Extensão de férias');
    });
  });

  describe('retomarNotificacoes', () => {
    it('deve retomar notificações pausadas', async () => {
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(mockPausa);
      mockPrisma.pausaNotificacao.update.mockResolvedValueOnce({
        ...mockPausa,
        ativo: false,
      });

      const resultado = await service.retomarNotificacoes('user1');

      expect(mockPrisma.pausaNotificacao.update).toHaveBeenCalledWith({
        where: { id: mockPausa.id },
        data: { ativo: false },
      });

      expect(resultado.ativo).toBe(false);
    });

    it('deve retornar null se não há pausa ativa', async () => {
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const resultado = await service.retomarNotificacoes('user1');

      expect(resultado).toBeNull();
      expect(mockPrisma.pausaNotificacao.update).not.toHaveBeenCalled();
    });
  });

  describe('verificarStatusPausa', () => {
    it('deve retornar status de pausa ativa', async () => {
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(mockPausa);

      const resultado = await service.verificarStatusPausa('user1');

      expect(mockPrisma.pausaNotificacao.findFirst).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1',
          ativo: true,
          OR: [
            { dataFim: null },
            { dataFim: { gte: expect.any(Date) } },
          ],
        },
      });

      expect(resultado).toEqual({
        pausado: true,
        pausa: mockPausa,
      });
    });

    it('deve retornar status sem pausa', async () => {
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const resultado = await service.verificarStatusPausa('user1');

      expect(resultado).toEqual({
        pausado: false,
        pausa: null,
      });
    });

    it('deve considerar pausa expirada como inativa', async () => {
      const pausaExpirada = {
        ...mockPausa,
        dataFim: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
      };

      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const resultado = await service.verificarStatusPausa('user1');

      expect(resultado.pausado).toBe(false);
    });
  });

  describe('validarPreferencias', () => {
    it('deve validar preferências válidas', () => {
      expect(() => service.validarPreferencias(mockPreferencias)).not.toThrow();
    });

    it('deve rejeitar urgência inválida', () => {
      const preferenciasInvalidas = {
        ...mockPreferencias,
        urgenciaMinima: 'invalida' as any,
      };

      expect(() => service.validarPreferencias(preferenciasInvalidas)).toThrow(
        'Urgência inválida'
      );
    });

    it('deve rejeitar formato de e-mail inválido', () => {
      const preferenciasInvalidas = {
        ...mockPreferencias,
        formatoEmail: 'invalido' as any,
      };

      expect(() => service.validarPreferencias(preferenciasInvalidas)).toThrow(
        'Formato de e-mail inválido'
      );
    });

    it('deve rejeitar idioma inválido', () => {
      const preferenciasInvalidas = {
        ...mockPreferencias,
        idioma: 'xx-XX',
      };

      expect(() => service.validarPreferencias(preferenciasInvalidas)).toThrow(
        'Idioma não suportado'
      );
    });

    it('deve validar tipos de notificação', () => {
      const preferenciasInvalidas = {
        ...mockPreferencias,
        tiposNotificacao: {
          ...mockPreferencias.tiposNotificacao,
          pendente: {
            ...mockPreferencias.tiposNotificacao.pendente,
            frequencia: 'invalida' as any,
          },
        },
      };

      expect(() => service.validarPreferencias(preferenciasInvalidas)).toThrow(
        'Frequência inválida'
      );
    });
  });

  describe('obterPreferenciasPadrao', () => {
    it('deve retornar preferências padrão corretas', () => {
      const padrao = service.obterPreferenciasPadrao();

      expect(padrao.ativo).toBe(true);
      expect(padrao.notificacaoEmail).toBe(true);
      expect(padrao.formatoEmail).toBe('html');
      expect(padrao.idioma).toBe('pt-BR');
      expect(padrao.urgenciaMinima).toBe('baixa');
      expect(padrao.tiposNotificacao.pendente.ativo).toBe(true);
      expect(padrao.tiposNotificacao.vencida.ativo).toBe(true);
      expect(padrao.tiposNotificacao.nova.ativo).toBe(false);
    });
  });

  describe('verificarPermissaoNotificacao', () => {
    it('deve permitir notificação se preferências ativas', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(mockPreferencias);
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const resultado = await service.verificarPermissaoNotificacao(
        'user1',
        'pendente' as TipoNotificacao,
        'media' as UrgenciaNotificacao
      );

      expect(resultado.permitido).toBe(true);
      expect(resultado.motivo).toBeUndefined();
    });

    it('deve bloquear se notificações desativadas', async () => {
      const preferenciasInativas = {
        ...mockPreferencias,
        ativo: false,
      };

      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(preferenciasInativas);

      const resultado = await service.verificarPermissaoNotificacao(
        'user1',
        'pendente' as TipoNotificacao,
        'media' as UrgenciaNotificacao
      );

      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toBe('Notificações desativadas pelo usuário');
    });

    it('deve bloquear se tipo específico desativado', async () => {
      const preferenciasComTipoInativo = {
        ...mockPreferencias,
        tiposNotificacao: {
          ...mockPreferencias.tiposNotificacao,
          pendente: {
            ...mockPreferencias.tiposNotificacao.pendente,
            ativo: false,
          },
        },
      };

      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(preferenciasComTipoInativo);
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const resultado = await service.verificarPermissaoNotificacao(
        'user1',
        'pendente' as TipoNotificacao,
        'media' as UrgenciaNotificacao
      );

      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toBe('Tipo de notificação pendente desativado');
    });

    it('deve bloquear se urgência abaixo do mínimo', async () => {
      const preferenciasUrgenciaAlta = {
        ...mockPreferencias,
        urgenciaMinima: 'alta' as UrgenciaNotificacao,
      };

      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(preferenciasUrgenciaAlta);
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const resultado = await service.verificarPermissaoNotificacao(
        'user1',
        'pendente' as TipoNotificacao,
        'baixa' as UrgenciaNotificacao
      );

      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toBe('Urgência abaixo do mínimo configurado');
    });

    it('deve bloquear se notificações pausadas', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(mockPreferencias);
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(mockPausa);

      const resultado = await service.verificarPermissaoNotificacao(
        'user1',
        'pendente' as TipoNotificacao,
        'media' as UrgenciaNotificacao
      );

      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toBe('Notificações pausadas: Férias');
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de conexão com banco', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(service.buscarPreferencias('user1')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('deve tratar erro na atualização', async () => {
      mockPrisma.preferenciasNotificacao.upsert.mockRejectedValueOnce(
        new Error('Update failed')
      );

      await expect(
        service.atualizarPreferencias('user1', { ativo: false })
      ).rejects.toThrow('Update failed');
    });

    it('deve tratar erro na pausa', async () => {
      mockPrisma.pausaNotificacao.create.mockRejectedValueOnce(
        new Error('Pause failed')
      );

      await expect(
        service.pausarNotificacoes('user1', new Date(), new Date(Date.now() + 86400000))
      ).rejects.toThrow('Pause failed');
    });
  });

  describe('Performance', () => {
    it('deve usar índices apropriados para consultas', async () => {
      await service.buscarPreferencias('user1');

      expect(mockPrisma.preferenciasNotificacao.findUnique).toHaveBeenCalledWith({
        where: { usuarioId: 'user1' }, // Campo indexado
      });
    });

    it('deve otimizar consultas de status de pausa', async () => {
      await service.verificarStatusPausa('user1');

      expect(mockPrisma.pausaNotificacao.findFirst).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1', // Campo indexado
          ativo: true, // Campo indexado
          OR: expect.any(Array),
        },
      });
    });
  });

  describe('Integração', () => {
    it('deve integrar com sistema de notificações', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(mockPreferencias);
      mockPrisma.pausaNotificacao.findFirst.mockResolvedValueOnce(null);

      const permissao = await service.verificarPermissaoNotificacao(
        'user1',
        'pendente' as TipoNotificacao,
        'media' as UrgenciaNotificacao
      );

      expect(permissao.permitido).toBe(true);
      expect(permissao.preferencias).toEqual(mockPreferencias);
    });

    it('deve fornecer configurações para agendador', async () => {
      mockPrisma.preferenciasNotificacao.findUnique.mockResolvedValueOnce(mockPreferencias);

      const preferencias = await service.buscarPreferencias('user1');

      expect(preferencias.tiposNotificacao.pendente.frequencia).toBe('diaria');
      expect(preferencias.tiposNotificacao.pendente.horarioEnvio).toBe('09:00');
      expect(preferencias.tiposNotificacao.pendente.diasAntecedencia).toEqual([7, 3, 1]);
    });
  });

  describe('Validações Específicas', () => {
    it('deve validar horário no formato HH:MM', () => {
      expect(() => service.validarHorario('09:30')).not.toThrow();
      expect(() => service.validarHorario('23:59')).not.toThrow();
      expect(() => service.validarHorario('00:00')).not.toThrow();
      
      expect(() => service.validarHorario('24:00')).toThrow('Horário inválido');
      expect(() => service.validarHorario('09:60')).toThrow('Horário inválido');
      expect(() => service.validarHorario('9:30')).toThrow('Horário inválido');
      expect(() => service.validarHorario('09:3')).toThrow('Horário inválido');
    });

    it('deve validar dias de antecedência', () => {
      expect(() => service.validarDiasAntecedencia([1, 3, 7])).not.toThrow();
      expect(() => service.validarDiasAntecedencia([0])).not.toThrow();
      expect(() => service.validarDiasAntecedencia([])).not.toThrow();
      
      expect(() => service.validarDiasAntecedencia([-1])).toThrow(
        'Dias de antecedência devem ser positivos'
      );
      expect(() => service.validarDiasAntecedencia([1, -3, 7])).toThrow(
        'Dias de antecedência devem ser positivos'
      );
    });

    it('deve validar urgência', () => {
      expect(() => service.validarUrgencia('baixa')).not.toThrow();
      expect(() => service.validarUrgencia('media')).not.toThrow();
      expect(() => service.validarUrgencia('alta')).not.toThrow();
      
      expect(() => service.validarUrgencia('invalida' as any)).toThrow(
        'Urgência inválida'
      );
    });

    it('deve validar frequência', () => {
      expect(() => service.validarFrequencia('imediata')).not.toThrow();
      expect(() => service.validarFrequencia('diaria')).not.toThrow();
      expect(() => service.validarFrequencia('semanal')).not.toThrow();
      expect(() => service.validarFrequencia('personalizada')).not.toThrow();
      
      expect(() => service.validarFrequencia('invalida' as any)).toThrow(
        'Frequência inválida'
      );
    });
  });
});