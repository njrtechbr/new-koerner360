import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AgendadorLembretesService } from '../agendador-lembretes';
import { TipoLembrete } from '../../types/lembrete';

// Mock do Prisma
const mockPrisma = {
  configuracaoAgendador: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  statusAgendador: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  lembrete: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  avaliacao: {
    findMany: jest.fn(),
  },
  usuario: {
    findMany: jest.fn(),
  },
};

// Mock do serviço de lembretes
const mockLembretesService = {
  criarLembrete: jest.fn(),
  buscarLembretesPendentes: jest.fn(),
  processarFilaEnvio: jest.fn(),
  limparLembretesAntigos: jest.fn(),
};

// Mock do serviço de e-mail
const mockEmailService = {
  enviarEmail: jest.fn(),
  enviarLembrete: jest.fn(),
};

// Dados de teste
const mockConfiguracao = {
  id: '1',
  ativo: true,
  intervaloVerificacao: 60,
  horariosEnvio: ['09:00', '14:00', '18:00'],
  diasAntecedencia: {
    prazo_vencimento: [7, 3, 1],
    avaliacao_pendente: [14, 7, 3],
    followup: [7],
  },
  tiposNotificacao: {
    prazo_vencimento: true,
    avaliacao_pendente: true,
    followup: false,
    personalizado: false,
  },
  filtros: {
    incluirFinsDeSemanaSemana: false,
    incluirFeriados: false,
    avaliacoesUsuario: true,
    avaliacoesQueAvalia: true,
  },
  configuracaoEmail: {
    assunto: 'Lembrete de Avaliação - {nomeAvaliacao}',
    template: 'lembrete-avaliacao',
    incluirDetalhes: true,
    incluirLinkDireto: true,
  },
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const mockStatus = {
  id: '1',
  ativo: false,
  ultimaExecucao: null,
  proximaExecucao: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  ultimoErro: null,
  estatisticas: {
    totalExecucoes: 0,
    sucessos: 0,
    falhas: 0,
    lembretesGerados: 0,
    lembretesEnviados: 0,
    ultimaLimpeza: null,
  },
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
};

const mockEstatisticas = {
  totalExecucoes: 150,
  sucessos: 145,
  falhas: 5,
  lembretesGerados: 1250,
  lembretesEnviados: 1200,
  taxaSucesso: 96.7,
  mediaLembretesPorExecucao: 8.3,
  ultimaExecucao: new Date().toISOString(),
  proximaExecucao: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  tempoMedioExecucao: 2.5,
  porTipo: {
    prazo_vencimento: 800,
    avaliacao_pendente: 350,
    followup: 100,
    personalizado: 0,
  },
  porPeriodo: {
    hoje: 25,
    ontem: 30,
    ultimaSemana: 180,
    ultimoMes: 750,
  },
};

describe('AgendadorLembretesService', () => {
  let service: AgendadorLembretesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgendadorLembretesService(
      mockPrisma as any,
      mockLembretesService as any,
      mockEmailService as any
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarConfiguracao', () => {
    it('deve buscar configuração existente', async () => {
      mockPrisma.configuracaoAgendador.findUnique.mockResolvedValueOnce(mockConfiguracao);

      const resultado = await service.buscarConfiguracao();

      expect(mockPrisma.configuracaoAgendador.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(resultado).toEqual(mockConfiguracao);
    });

    it('deve retornar configuração padrão se não existir', async () => {
      mockPrisma.configuracaoAgendador.findUnique.mockResolvedValueOnce(null);

      const resultado = await service.buscarConfiguracao();

      expect(resultado).toEqual({
        id: '1',
        ativo: false,
        intervaloVerificacao: 60,
        horariosEnvio: ['09:00', '14:00', '18:00'],
        diasAntecedencia: {
          prazo_vencimento: [7, 3, 1],
          avaliacao_pendente: [14, 7, 3],
          followup: [7],
          personalizado: [],
        },
        tiposNotificacao: {
          prazo_vencimento: true,
          avaliacao_pendente: true,
          followup: false,
          personalizado: false,
        },
        filtros: {
          incluirFinsDeSemanaSemana: false,
          incluirFeriados: false,
          avaliacoesUsuario: true,
          avaliacoesQueAvalia: true,
        },
        configuracaoEmail: {
          assunto: 'Lembrete de Avaliação - {nomeAvaliacao}',
          template: 'lembrete-avaliacao',
          incluirDetalhes: true,
          incluirLinkDireto: true,
        },
      });
    });
  });

  describe('atualizarConfiguracao', () => {
    it('deve atualizar configuração existente', async () => {
      const novaConfiguracao = {
        ativo: true,
        intervaloVerificacao: 30,
        horariosEnvio: ['08:00', '16:00'],
      };

      const configuracaoAtualizada = {
        ...mockConfiguracao,
        ...novaConfiguracao,
      };

      mockPrisma.configuracaoAgendador.upsert.mockResolvedValueOnce(configuracaoAtualizada);

      const resultado = await service.atualizarConfiguracao(novaConfiguracao);

      expect(mockPrisma.configuracaoAgendador.upsert).toHaveBeenCalledWith({
        where: { id: '1' },
        create: expect.objectContaining({
          id: '1',
          ...novaConfiguracao,
        }),
        update: novaConfiguracao,
      });

      expect(resultado.ativo).toBe(true);
      expect(resultado.intervaloVerificacao).toBe(30);
    });

    it('deve validar horários de envio', async () => {
      const configuracaoInvalida = {
        horariosEnvio: ['25:00', '14:00'], // Horário inválido
      };

      await expect(
        service.atualizarConfiguracao(configuracaoInvalida)
      ).rejects.toThrow('Horário inválido');
    });

    it('deve validar intervalo de verificação', async () => {
      const configuracaoInvalida = {
        intervaloVerificacao: 0, // Intervalo inválido
      };

      await expect(
        service.atualizarConfiguracao(configuracaoInvalida)
      ).rejects.toThrow('Intervalo deve ser maior que 0');
    });
  });

  describe('buscarStatus', () => {
    it('deve buscar status existente', async () => {
      mockPrisma.statusAgendador.findUnique.mockResolvedValueOnce(mockStatus);

      const resultado = await service.buscarStatus();

      expect(mockPrisma.statusAgendador.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(resultado).toEqual(mockStatus);
    });

    it('deve retornar status padrão se não existir', async () => {
      mockPrisma.statusAgendador.findUnique.mockResolvedValueOnce(null);

      const resultado = await service.buscarStatus();

      expect(resultado).toEqual({
        id: '1',
        ativo: false,
        ultimaExecucao: null,
        proximaExecucao: null,
        ultimoErro: null,
        estatisticas: {
          totalExecucoes: 0,
          sucessos: 0,
          falhas: 0,
          lembretesGerados: 0,
          lembretesEnviados: 0,
          ultimaLimpeza: null,
        },
      });
    });
  });

  describe('iniciarAgendador', () => {
    it('deve iniciar agendador com sucesso', async () => {
      mockPrisma.configuracaoAgendador.findUnique.mockResolvedValueOnce(mockConfiguracao);
      mockPrisma.statusAgendador.upsert.mockResolvedValueOnce({
        ...mockStatus,
        ativo: true,
        proximaExecucao: new Date(Date.now() + 60 * 60 * 1000),
      });

      const resultado = await service.iniciarAgendador();

      expect(mockPrisma.statusAgendador.upsert).toHaveBeenCalledWith({
        where: { id: '1' },
        create: expect.objectContaining({
          id: '1',
          ativo: true,
          proximaExecucao: expect.any(Date),
        }),
        update: {
          ativo: true,
          proximaExecucao: expect.any(Date),
          ultimoErro: null,
        },
      });

      expect(resultado.ativo).toBe(true);
      expect(resultado.proximaExecucao).toBeTruthy();
    });

    it('deve falhar se configuração não estiver ativa', async () => {
      const configuracaoInativa = {
        ...mockConfiguracao,
        ativo: false,
      };

      mockPrisma.configuracaoAgendador.findUnique.mockResolvedValueOnce(configuracaoInativa);

      await expect(service.iniciarAgendador()).rejects.toThrow(
        'Configuração do agendador não está ativa'
      );
    });
  });

  describe('pararAgendador', () => {
    it('deve parar agendador', async () => {
      mockPrisma.statusAgendador.upsert.mockResolvedValueOnce({
        ...mockStatus,
        ativo: false,
        proximaExecucao: null,
      });

      const resultado = await service.pararAgendador();

      expect(mockPrisma.statusAgendador.upsert).toHaveBeenCalledWith({
        where: { id: '1' },
        create: expect.objectContaining({
          id: '1',
          ativo: false,
          proximaExecucao: null,
        }),
        update: {
          ativo: false,
          proximaExecucao: null,
        },
      });

      expect(resultado.ativo).toBe(false);
      expect(resultado.proximaExecucao).toBeNull();
    });
  });

  describe('forcarVerificacao', () => {
    it('deve executar verificação manual', async () => {
      mockPrisma.configuracaoAgendador.findUnique.mockResolvedValueOnce(mockConfiguracao);
      mockPrisma.avaliacao.findMany.mockResolvedValueOnce([
        {
          id: 'aval1',
          titulo: 'Avaliação Teste',
          prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'pendente',
          usuarioId: 'user1',
        },
      ]);
      mockPrisma.lembrete.findMany.mockResolvedValueOnce([]);
      mockLembretesService.criarLembrete.mockResolvedValueOnce({ id: 'lembrete1' });
      mockPrisma.statusAgendador.upsert.mockResolvedValueOnce({
        ...mockStatus,
        ultimaExecucao: new Date(),
        estatisticas: {
          ...mockStatus.estatisticas,
          totalExecucoes: 1,
          sucessos: 1,
          lembretesGerados: 1,
        },
      });

      const resultado = await service.forcarVerificacao();

      expect(mockLembretesService.criarLembrete).toHaveBeenCalled();
      expect(resultado.lembretesGerados).toBe(1);
      expect(resultado.sucessos).toBe(1);
    });

    it('deve tratar erros na verificação', async () => {
      mockPrisma.configuracaoAgendador.findUnique.mockRejectedValueOnce(
        new Error('Erro de configuração')
      );
      mockPrisma.statusAgendador.upsert.mockResolvedValueOnce({
        ...mockStatus,
        ultimoErro: 'Erro de configuração',
        estatisticas: {
          ...mockStatus.estatisticas,
          totalExecucoes: 1,
          falhas: 1,
        },
      });

      const resultado = await service.forcarVerificacao();

      expect(resultado.ultimoErro).toBe('Erro de configuração');
      expect(resultado.estatisticas.falhas).toBe(1);
    });
  });

  describe('limparLembretesPendentes', () => {
    it('deve limpar lembretes pendentes', async () => {
      mockPrisma.lembrete.deleteMany.mockResolvedValueOnce({ count: 10 });

      const resultado = await service.limparLembretesPendentes();

      expect(mockPrisma.lembrete.deleteMany).toHaveBeenCalledWith({
        where: {
          status: 'pendente',
        },
      });

      expect(resultado.removidos).toBe(10);
    });

    it('deve limpar lembretes com filtros', async () => {
      mockPrisma.lembrete.deleteMany.mockResolvedValueOnce({ count: 5 });

      const filtros = {
        tipo: 'prazo_vencimento' as TipoLembrete,
        usuarioId: 'user1',
      };

      await service.limparLembretesPendentes(filtros);

      expect(mockPrisma.lembrete.deleteMany).toHaveBeenCalledWith({
        where: {
          status: 'pendente',
          tipo: 'prazo_vencimento',
          usuarioId: 'user1',
        },
      });
    });
  });

  describe('resetarConfiguracao', () => {
    it('deve resetar configuração para padrões', async () => {
      const configuracaoPadrao = {
        id: '1',
        ativo: false,
        intervaloVerificacao: 60,
        horariosEnvio: ['09:00', '14:00', '18:00'],
        diasAntecedencia: {
          prazo_vencimento: [7, 3, 1],
          avaliacao_pendente: [14, 7, 3],
          followup: [7],
          personalizado: [],
        },
        tiposNotificacao: {
          prazo_vencimento: true,
          avaliacao_pendente: true,
          followup: false,
          personalizado: false,
        },
        filtros: {
          incluirFinsDeSemanaSemana: false,
          incluirFeriados: false,
          avaliacoesUsuario: true,
          avaliacoesQueAvalia: true,
        },
        configuracaoEmail: {
          assunto: 'Lembrete de Avaliação - {nomeAvaliacao}',
          template: 'lembrete-avaliacao',
          incluirDetalhes: true,
          incluirLinkDireto: true,
        },
      };

      mockPrisma.configuracaoAgendador.upsert.mockResolvedValueOnce(configuracaoPadrao);
      mockPrisma.statusAgendador.upsert.mockResolvedValueOnce({
        ...mockStatus,
        ativo: false,
        proximaExecucao: null,
        ultimoErro: null,
        estatisticas: {
          totalExecucoes: 0,
          sucessos: 0,
          falhas: 0,
          lembretesGerados: 0,
          lembretesEnviados: 0,
          ultimaLimpeza: null,
        },
      });

      const resultado = await service.resetarConfiguracao();

      expect(resultado.configuracao.ativo).toBe(false);
      expect(resultado.status.ativo).toBe(false);
      expect(resultado.status.estatisticas.totalExecucoes).toBe(0);
    });
  });

  describe('buscarEstatisticas', () => {
    it('deve buscar estatísticas básicas', async () => {
      mockPrisma.statusAgendador.findUnique.mockResolvedValueOnce({
        ...mockStatus,
        estatisticas: mockEstatisticas,
      });
      mockPrisma.lembrete.count.mockImplementation(({ where }) => {
        if (where?.tipo === 'prazo_vencimento') return Promise.resolve(800);
        if (where?.tipo === 'avaliacao_pendente') return Promise.resolve(350);
        if (where?.tipo === 'followup') return Promise.resolve(100);
        return Promise.resolve(1250);
      });

      const resultado = await service.buscarEstatisticas();

      expect(resultado.totalExecucoes).toBe(150);
      expect(resultado.sucessos).toBe(145);
      expect(resultado.falhas).toBe(5);
      expect(resultado.taxaSucesso).toBeCloseTo(96.7, 1);
    });

    it('deve buscar estatísticas com filtros', async () => {
      const filtros = {
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        tipo: 'prazo_vencimento' as TipoLembrete,
      };

      mockPrisma.lembrete.count.mockResolvedValueOnce(500);

      await service.buscarEstatisticas(filtros);

      expect(mockPrisma.lembrete.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tipo: 'prazo_vencimento',
            criadoEm: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
        })
      );
    });
  });

  describe('gerarLembretes', () => {
    it('deve gerar lembretes para avaliações próximas do vencimento', async () => {
      const avaliacoes = [
        {
          id: 'aval1',
          titulo: 'Avaliação Anual 2024',
          prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
          status: 'pendente',
          usuarioId: 'user1',
          usuario: {
            id: 'user1',
            nome: 'João Silva',
            email: 'joao@empresa.com',
          },
        },
      ];

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(avaliacoes);
      mockPrisma.lembrete.findMany.mockResolvedValueOnce([]);
      mockLembretesService.criarLembrete.mockResolvedValueOnce({ id: 'lembrete1' });

      const resultado = await service.gerarLembretes(mockConfiguracao);

      expect(mockLembretesService.criarLembrete).toHaveBeenCalledWith({
        usuarioId: 'user1',
        avaliacaoId: 'aval1',
        tipo: 'prazo_vencimento',
        titulo: expect.stringContaining('Lembrete'),
        mensagem: expect.any(String),
        dataEnvio: expect.any(Date),
        metadados: expect.objectContaining({
          nomeAvaliacao: 'Avaliação Anual 2024',
          diasAntecedencia: 3,
        }),
      });

      expect(resultado.gerados).toBe(1);
    });

    it('deve evitar duplicar lembretes existentes', async () => {
      const avaliacoes = [
        {
          id: 'aval1',
          titulo: 'Avaliação Anual 2024',
          prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'pendente',
          usuarioId: 'user1',
          usuario: {
            id: 'user1',
            nome: 'João Silva',
            email: 'joao@empresa.com',
          },
        },
      ];

      const lembretesExistentes = [
        {
          id: 'lembrete1',
          usuarioId: 'user1',
          avaliacaoId: 'aval1',
          tipo: 'prazo_vencimento',
          metadados: { diasAntecedencia: 3 },
        },
      ];

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(avaliacoes);
      mockPrisma.lembrete.findMany.mockResolvedValueOnce(lembretesExistentes);

      const resultado = await service.gerarLembretes(mockConfiguracao);

      expect(mockLembretesService.criarLembrete).not.toHaveBeenCalled();
      expect(resultado.gerados).toBe(0);
      expect(resultado.duplicados).toBe(1);
    });

    it('deve respeitar filtros de configuração', async () => {
      const configuracaoComFiltros = {
        ...mockConfiguracao,
        filtros: {
          incluirFinsDeSemanaSemana: false,
          incluirFeriados: false,
          avaliacoesUsuario: true,
          avaliacoesQueAvalia: false, // Não incluir avaliações que o usuário avalia
        },
      };

      await service.gerarLembretes(configuracaoComFiltros);

      expect(mockPrisma.avaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'pendente',
            // Deve incluir apenas avaliações do usuário
          }),
        })
      );
    });

    it('deve calcular data de envio corretamente', async () => {
      const avaliacoes = [
        {
          id: 'aval1',
          titulo: 'Avaliação Teste',
          prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          status: 'pendente',
          usuarioId: 'user1',
          usuario: {
            id: 'user1',
            nome: 'João Silva',
            email: 'joao@empresa.com',
          },
        },
      ];

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(avaliacoes);
      mockPrisma.lembrete.findMany.mockResolvedValueOnce([]);
      mockLembretesService.criarLembrete.mockResolvedValueOnce({ id: 'lembrete1' });

      await service.gerarLembretes(mockConfiguracao);

      // Verificar se a data de envio foi calculada corretamente
      // Para 7 dias de antecedência, deve enviar hoje
      const chamada = mockLembretesService.criarLembrete.mock.calls[0][0];
      const dataEnvio = new Date(chamada.dataEnvio);
      const hoje = new Date();
      
      expect(dataEnvio.getDate()).toBe(hoje.getDate());
    });
  });

  describe('calcularProximaExecucao', () => {
    it('deve calcular próxima execução baseada no intervalo', () => {
      const agora = new Date();
      const proximaExecucao = service.calcularProximaExecucao(60); // 60 minutos

      const diferencaMinutos = (proximaExecucao.getTime() - agora.getTime()) / (1000 * 60);
      expect(diferencaMinutos).toBeCloseTo(60, 1);
    });

    it('deve usar horário específico se fornecido', () => {
      const proximaExecucao = service.calcularProximaExecucao(60, '14:30');

      expect(proximaExecucao.getHours()).toBe(14);
      expect(proximaExecucao.getMinutes()).toBe(30);
    });
  });

  describe('validarConfiguracao', () => {
    it('deve validar configuração válida', () => {
      expect(() => service.validarConfiguracao(mockConfiguracao)).not.toThrow();
    });

    it('deve rejeitar intervalo inválido', () => {
      const configuracaoInvalida = {
        ...mockConfiguracao,
        intervaloVerificacao: -1,
      };

      expect(() => service.validarConfiguracao(configuracaoInvalida)).toThrow(
        'Intervalo deve ser maior que 0'
      );
    });

    it('deve rejeitar horários inválidos', () => {
      const configuracaoInvalida = {
        ...mockConfiguracao,
        horariosEnvio: ['25:00'],
      };

      expect(() => service.validarConfiguracao(configuracaoInvalida)).toThrow(
        'Horário inválido'
      );
    });

    it('deve rejeitar dias de antecedência inválidos', () => {
      const configuracaoInvalida = {
        ...mockConfiguracao,
        diasAntecedencia: {
          prazo_vencimento: [-1, 0], // Valores inválidos
        },
      };

      expect(() => service.validarConfiguracao(configuracaoInvalida)).toThrow(
        'Dias de antecedência devem ser positivos'
      );
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de conexão com banco', async () => {
      mockPrisma.configuracaoAgendador.findUnique.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(service.buscarConfiguracao()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('deve tratar erro na geração de lembretes', async () => {
      mockPrisma.avaliacao.findMany.mockRejectedValueOnce(
        new Error('Query failed')
      );

      await expect(
        service.gerarLembretes(mockConfiguracao)
      ).rejects.toThrow('Query failed');
    });
  });

  describe('Performance', () => {
    it('deve usar índices apropriados para consultas', async () => {
      await service.gerarLembretes(mockConfiguracao);

      // Verificar se as consultas usam campos indexados
      expect(mockPrisma.avaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'pendente', // Campo indexado
            prazo: expect.any(Object), // Campo indexado
          }),
        })
      );
    });

    it('deve limitar resultados para evitar sobrecarga', async () => {
      await service.gerarLembretes(mockConfiguracao);

      // Verificar se há limite nas consultas
      expect(mockPrisma.avaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: expect.any(Number),
        })
      );
    });
  });

  describe('Integração', () => {
    it('deve integrar com serviço de lembretes', async () => {
      const avaliacoes = [
        {
          id: 'aval1',
          titulo: 'Avaliação Teste',
          prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'pendente',
          usuarioId: 'user1',
          usuario: {
            id: 'user1',
            nome: 'João Silva',
            email: 'joao@empresa.com',
          },
        },
      ];

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(avaliacoes);
      mockPrisma.lembrete.findMany.mockResolvedValueOnce([]);
      mockLembretesService.criarLembrete.mockResolvedValueOnce({ id: 'lembrete1' });

      await service.gerarLembretes(mockConfiguracao);

      expect(mockLembretesService.criarLembrete).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user1',
          avaliacaoId: 'aval1',
          tipo: 'prazo_vencimento',
        })
      );
    });

    it('deve integrar com serviço de e-mail', async () => {
      mockLembretesService.processarFilaEnvio.mockResolvedValueOnce({
        processados: 5,
        enviados: 4,
        falhados: 1,
      });

      const resultado = await service.processarFilaEnvio();

      expect(mockLembretesService.processarFilaEnvio).toHaveBeenCalled();
      expect(resultado.enviados).toBe(4);
    });
  });
});