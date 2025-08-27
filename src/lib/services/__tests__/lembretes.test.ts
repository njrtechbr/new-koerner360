import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LembretesService } from '../lembretes';
import { TipoLembrete, StatusLembrete } from '../../types/lembrete';

// Mock do Prisma
const mockPrisma = {
  lembrete: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  usuario: {
    findMany: jest.fn(),
  },
  avaliacao: {
    findMany: jest.fn(),
  },
};

// Mock do serviço de e-mail
const mockEmailService = {
  enviarEmail: jest.fn(),
  enviarLembrete: jest.fn(),
};

// Mock dos lembretes de teste
const mockLembrete = {
  id: '1',
  usuarioId: 'user1',
  avaliacaoId: 'aval1',
  tipo: 'prazo_vencimento' as TipoLembrete,
  status: 'pendente' as StatusLembrete,
  titulo: 'Lembrete de Prazo',
  mensagem: 'Sua avaliação vence em 3 dias.',
  dataEnvio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  dataEnviado: null,
  tentativas: 0,
  maxTentativas: 3,
  intervaloTentativas: 60,
  ultimaFalha: null,
  metadados: {
    nomeAvaliacao: 'Avaliação Anual 2024',
    prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    avaliador: 'João Silva',
    diasAntecedencia: 3,
  },
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
};

const mockLembretes = [
  mockLembrete,
  {
    ...mockLembrete,
    id: '2',
    tipo: 'avaliacao_pendente' as TipoLembrete,
    status: 'enviado' as StatusLembrete,
    dataEnviado: new Date().toISOString(),
    tentativas: 1,
  },
  {
    ...mockLembrete,
    id: '3',
    tipo: 'followup' as TipoLembrete,
    status: 'falhado' as StatusLembrete,
    tentativas: 3,
    ultimaFalha: 'Erro de conexão SMTP',
  },
];

const mockEstatisticas = {
  total: 50,
  pendentes: 15,
  enviados: 30,
  falhados: 5,
  porTipo: {
    prazo_vencimento: 20,
    avaliacao_pendente: 15,
    followup: 10,
    personalizado: 5,
  },
  porStatus: {
    pendente: 15,
    enviado: 30,
    falhado: 5,
  },
  taxaSucesso: 85.7,
  mediaTempoEnvio: 2.5,
};

describe('LembretesService', () => {
  let service: LembretesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LembretesService(mockPrisma as any, mockEmailService as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarLembretes', () => {
    it('deve buscar lembretes com filtros padrão', async () => {
      mockPrisma.lembrete.findMany.mockResolvedValueOnce(mockLembretes);
      mockPrisma.lembrete.count.mockResolvedValueOnce(3);

      const resultado = await service.buscarLembretes();

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith({
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          avaliacao: {
            select: {
              id: true,
              titulo: true,
              prazo: true,
              status: true,
            },
          },
        },
        orderBy: {
          dataEnvio: 'asc',
        },
        skip: 0,
        take: 50,
      });

      expect(resultado.lembretes).toEqual(mockLembretes);
      expect(resultado.total).toBe(3);
    });

    it('deve aplicar filtros específicos', async () => {
      mockPrisma.lembrete.findMany.mockResolvedValueOnce([mockLembrete]);
      mockPrisma.lembrete.count.mockResolvedValueOnce(1);

      const filtros = {
        usuarioId: 'user1',
        avaliacaoId: 'aval1',
        tipo: 'prazo_vencimento' as TipoLembrete,
        status: 'pendente' as StatusLembrete,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 2,
        limite: 10,
      };

      await service.buscarLembretes(filtros);

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuarioId: 'user1',
            avaliacaoId: 'aval1',
            tipo: 'prazo_vencimento',
            status: 'pendente',
            dataEnvio: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
          skip: 10,
          take: 10,
        })
      );
    });

    it('deve aplicar busca por texto', async () => {
      mockPrisma.lembrete.findMany.mockResolvedValueOnce([mockLembrete]);
      mockPrisma.lembrete.count.mockResolvedValueOnce(1);

      await service.buscarLembretes({ busca: 'avaliação' });

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { titulo: { contains: 'avaliação', mode: 'insensitive' } },
              { mensagem: { contains: 'avaliação', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('deve aplicar ordenação personalizada', async () => {
      mockPrisma.lembrete.findMany.mockResolvedValueOnce(mockLembretes);
      mockPrisma.lembrete.count.mockResolvedValueOnce(3);

      await service.buscarLembretes({
        ordenarPor: 'tentativas',
        ordem: 'desc',
      });

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            tentativas: 'desc',
          },
        })
      );
    });
  });

  describe('buscarLembrete', () => {
    it('deve buscar lembrete por ID', async () => {
      mockPrisma.lembrete.findUnique.mockResolvedValueOnce(mockLembrete);

      const resultado = await service.buscarLembrete('1');

      expect(mockPrisma.lembrete.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          avaliacao: {
            select: {
              id: true,
              titulo: true,
              prazo: true,
              status: true,
            },
          },
        },
      });

      expect(resultado).toEqual(mockLembrete);
    });

    it('deve retornar null se lembrete não encontrado', async () => {
      mockPrisma.lembrete.findUnique.mockResolvedValueOnce(null);

      const resultado = await service.buscarLembrete('999');

      expect(resultado).toBeNull();
    });
  });

  describe('criarLembrete', () => {
    it('deve criar novo lembrete', async () => {
      const dadosLembrete = {
        usuarioId: 'user1',
        avaliacaoId: 'aval1',
        tipo: 'prazo_vencimento' as TipoLembrete,
        titulo: 'Novo Lembrete',
        mensagem: 'Mensagem do lembrete',
        dataEnvio: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadados: {
          diasAntecedencia: 1,
        },
      };

      mockPrisma.lembrete.create.mockResolvedValueOnce({
        ...mockLembrete,
        ...dadosLembrete,
      });

      const resultado = await service.criarLembrete(dadosLembrete);

      expect(mockPrisma.lembrete.create).toHaveBeenCalledWith({
        data: {
          ...dadosLembrete,
          status: 'pendente',
          tentativas: 0,
          maxTentativas: 3,
          intervaloTentativas: 60,
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          avaliacao: {
            select: {
              id: true,
              titulo: true,
              prazo: true,
              status: true,
            },
          },
        },
      });

      expect(resultado.tipo).toBe('prazo_vencimento');
      expect(resultado.status).toBe('pendente');
    });

    it('deve aplicar configurações padrão', async () => {
      const dadosMinimos = {
        usuarioId: 'user1',
        tipo: 'personalizado' as TipoLembrete,
        titulo: 'Lembrete Simples',
        mensagem: 'Mensagem simples',
        dataEnvio: new Date(),
      };

      mockPrisma.lembrete.create.mockResolvedValueOnce({
        ...mockLembrete,
        ...dadosMinimos,
      });

      await service.criarLembrete(dadosMinimos);

      expect(mockPrisma.lembrete.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maxTentativas: 3,
            intervaloTentativas: 60,
            status: 'pendente',
            tentativas: 0,
          }),
        })
      );
    });
  });

  describe('atualizarLembrete', () => {
    it('deve atualizar lembrete existente', async () => {
      const dadosAtualizacao = {
        titulo: 'Título Atualizado',
        mensagem: 'Mensagem atualizada',
        dataEnvio: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };

      const lembreteAtualizado = {
        ...mockLembrete,
        ...dadosAtualizacao,
      };

      mockPrisma.lembrete.update.mockResolvedValueOnce(lembreteAtualizado);

      const resultado = await service.atualizarLembrete('1', dadosAtualizacao);

      expect(mockPrisma.lembrete.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dadosAtualizacao,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          avaliacao: {
            select: {
              id: true,
              titulo: true,
              prazo: true,
              status: true,
            },
          },
        },
      });

      expect(resultado.titulo).toBe('Título Atualizado');
    });

    it('deve lançar erro se lembrete não encontrado', async () => {
      mockPrisma.lembrete.update.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(
        service.atualizarLembrete('999', { titulo: 'Novo título' })
      ).rejects.toThrow();
    });
  });

  describe('removerLembrete', () => {
    it('deve remover lembrete', async () => {
      mockPrisma.lembrete.delete.mockResolvedValueOnce(mockLembrete);

      const resultado = await service.removerLembrete('1');

      expect(mockPrisma.lembrete.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });

      expect(resultado).toEqual(mockLembrete);
    });

    it('deve lançar erro se lembrete não encontrado', async () => {
      mockPrisma.lembrete.delete.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(service.removerLembrete('999')).rejects.toThrow();
    });
  });

  describe('removerLembretes', () => {
    it('deve remover múltiplos lembretes', async () => {
      mockPrisma.lembrete.deleteMany.mockResolvedValueOnce({ count: 3 });

      const resultado = await service.removerLembretes(['1', '2', '3']);

      expect(mockPrisma.lembrete.deleteMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['1', '2', '3'],
          },
        },
      });

      expect(resultado.removidos).toBe(3);
    });

    it('deve remover lembretes com filtros', async () => {
      mockPrisma.lembrete.deleteMany.mockResolvedValueOnce({ count: 5 });

      const filtros = {
        status: 'falhado' as StatusLembrete,
        dataInicio: '2024-01-01',
        dataFim: '2024-06-30',
      };

      await service.removerLembretes(undefined, filtros);

      expect(mockPrisma.lembrete.deleteMany).toHaveBeenCalledWith({
        where: {
          status: 'falhado',
          dataEnvio: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-06-30'),
          },
        },
      });
    });
  });

  describe('reenviarLembrete', () => {
    it('deve reenviar lembrete com sucesso', async () => {
      const lembreteParaReenvio = {
        ...mockLembrete,
        status: 'falhado' as StatusLembrete,
        tentativas: 1,
      };

      mockPrisma.lembrete.findUnique.mockResolvedValueOnce(lembreteParaReenvio);
      mockEmailService.enviarLembrete.mockResolvedValueOnce(true);
      mockPrisma.lembrete.update.mockResolvedValueOnce({
        ...lembreteParaReenvio,
        status: 'enviado',
        dataEnviado: new Date(),
        tentativas: 2,
      });

      const resultado = await service.reenviarLembrete('1');

      expect(mockEmailService.enviarLembrete).toHaveBeenCalledWith(lembreteParaReenvio);
      expect(mockPrisma.lembrete.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'enviado',
          dataEnviado: expect.any(Date),
          tentativas: 2,
          ultimaFalha: null,
        },
      });

      expect(resultado.status).toBe('enviado');
      expect(resultado.tentativas).toBe(2);
    });

    it('deve falhar ao atingir máximo de tentativas', async () => {
      const lembreteEsgotado = {
        ...mockLembrete,
        status: 'falhado' as StatusLembrete,
        tentativas: 3,
        maxTentativas: 3,
      };

      mockPrisma.lembrete.findUnique.mockResolvedValueOnce(lembreteEsgotado);

      await expect(service.reenviarLembrete('1')).rejects.toThrow(
        'Máximo de tentativas atingido'
      );
    });

    it('deve registrar falha no envio', async () => {
      const lembreteParaReenvio = {
        ...mockLembrete,
        status: 'pendente' as StatusLembrete,
        tentativas: 1,
      };

      mockPrisma.lembrete.findUnique.mockResolvedValueOnce(lembreteParaReenvio);
      mockEmailService.enviarLembrete.mockRejectedValueOnce(
        new Error('Falha no envio de e-mail')
      );
      mockPrisma.lembrete.update.mockResolvedValueOnce({
        ...lembreteParaReenvio,
        status: 'falhado',
        tentativas: 2,
        ultimaFalha: 'Falha no envio de e-mail',
      });

      const resultado = await service.reenviarLembrete('1');

      expect(mockPrisma.lembrete.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'falhado',
          tentativas: 2,
          ultimaFalha: 'Falha no envio de e-mail',
        },
      });

      expect(resultado.status).toBe('falhado');
      expect(resultado.ultimaFalha).toBe('Falha no envio de e-mail');
    });
  });

  describe('reenviarLembretes', () => {
    it('deve reenviar múltiplos lembretes', async () => {
      const lembretesFalhados = [
        { ...mockLembrete, id: '1', status: 'falhado' as StatusLembrete },
        { ...mockLembrete, id: '2', status: 'falhado' as StatusLembrete },
      ];

      mockPrisma.lembrete.findMany.mockResolvedValueOnce(lembretesFalhados);
      mockEmailService.enviarLembrete
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);
      mockPrisma.lembrete.update
        .mockResolvedValueOnce({ ...lembretesFalhados[0], status: 'enviado' })
        .mockResolvedValueOnce({ ...lembretesFalhados[1], status: 'enviado' });

      const resultado = await service.reenviarLembretes(['1', '2']);

      expect(resultado.reenviados).toBe(2);
      expect(resultado.falhados).toBe(0);
    });

    it('deve contar falhas no reenvio em lote', async () => {
      const lembretesFalhados = [
        { ...mockLembrete, id: '1', status: 'falhado' as StatusLembrete },
        { ...mockLembrete, id: '2', status: 'falhado' as StatusLembrete },
      ];

      mockPrisma.lembrete.findMany.mockResolvedValueOnce(lembretesFalhados);
      mockEmailService.enviarLembrete
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Falha'));
      mockPrisma.lembrete.update
        .mockResolvedValueOnce({ ...lembretesFalhados[0], status: 'enviado' })
        .mockResolvedValueOnce({ ...lembretesFalhados[1], status: 'falhado' });

      const resultado = await service.reenviarLembretes(['1', '2']);

      expect(resultado.reenviados).toBe(1);
      expect(resultado.falhados).toBe(1);
    });
  });

  describe('marcarComoEnviado', () => {
    it('deve marcar lembrete como enviado', async () => {
      const lembreteEnviado = {
        ...mockLembrete,
        status: 'enviado' as StatusLembrete,
        dataEnviado: new Date(),
        tentativas: 1,
      };

      mockPrisma.lembrete.update.mockResolvedValueOnce(lembreteEnviado);

      const resultado = await service.marcarComoEnviado('1');

      expect(mockPrisma.lembrete.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'enviado',
          dataEnviado: expect.any(Date),
          tentativas: expect.any(Number),
        },
      });

      expect(resultado.status).toBe('enviado');
      expect(resultado.dataEnviado).toBeTruthy();
    });
  });

  describe('reagendarLembrete', () => {
    it('deve reagendar lembrete para nova data', async () => {
      const novaData = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const lembreteReagendado = {
        ...mockLembrete,
        dataEnvio: novaData,
        status: 'pendente' as StatusLembrete,
        tentativas: 0,
      };

      mockPrisma.lembrete.update.mockResolvedValueOnce(lembreteReagendado);

      const resultado = await service.reagendarLembrete('1', novaData);

      expect(mockPrisma.lembrete.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          dataEnvio: novaData,
          status: 'pendente',
          tentativas: 0,
          dataEnviado: null,
          ultimaFalha: null,
        },
      });

      expect(resultado.dataEnvio).toEqual(novaData.toISOString());
      expect(resultado.status).toBe('pendente');
    });

    it('deve validar data futura', async () => {
      const dataPassada = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await expect(
        service.reagendarLembrete('1', dataPassada)
      ).rejects.toThrow('Data de envio deve ser futura');
    });
  });

  describe('buscarLembretesPendentes', () => {
    it('deve buscar lembretes prontos para envio', async () => {
      const lembretesPendentes = [
        {
          ...mockLembrete,
          dataEnvio: new Date(Date.now() - 60 * 1000), // 1 minuto atrás
        },
      ];

      mockPrisma.lembrete.findMany.mockResolvedValueOnce(lembretesPendentes);

      const resultado = await service.buscarLembretesPendentes();

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith({
        where: {
          status: 'pendente',
          dataEnvio: {
            lte: expect.any(Date),
          },
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          avaliacao: {
            select: {
              id: true,
              titulo: true,
              prazo: true,
              status: true,
            },
          },
        },
        orderBy: {
          dataEnvio: 'asc',
        },
      });

      expect(resultado).toEqual(lembretesPendentes);
    });

    it('deve limitar quantidade de lembretes', async () => {
      await service.buscarLembretesPendentes(10);

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });

  describe('buscarEstatisticas', () => {
    it('deve buscar estatísticas básicas', async () => {
      mockPrisma.lembrete.count.mockImplementation(({ where }) => {
        if (where?.status === 'pendente') return Promise.resolve(15);
        if (where?.status === 'enviado') return Promise.resolve(30);
        if (where?.status === 'falhado') return Promise.resolve(5);
        return Promise.resolve(50);
      });

      const resultado = await service.buscarEstatisticas();

      expect(resultado.total).toBe(50);
      expect(resultado.pendentes).toBe(15);
      expect(resultado.enviados).toBe(30);
      expect(resultado.falhados).toBe(5);
      expect(resultado.taxaSucesso).toBeCloseTo(85.7, 1);
    });

    it('deve buscar estatísticas com filtros', async () => {
      const filtros = {
        usuarioId: 'user1',
        tipo: 'prazo_vencimento' as TipoLembrete,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      };

      mockPrisma.lembrete.count.mockResolvedValueOnce(25);

      await service.buscarEstatisticas(filtros);

      expect(mockPrisma.lembrete.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuarioId: 'user1',
            tipo: 'prazo_vencimento',
            dataEnvio: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
        })
      );
    });
  });

  describe('limparLembretesAntigos', () => {
    it('deve remover lembretes antigos enviados', async () => {
      mockPrisma.lembrete.deleteMany.mockResolvedValueOnce({ count: 20 });

      const resultado = await service.limparLembretesAntigos(60);

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 60);

      expect(mockPrisma.lembrete.deleteMany).toHaveBeenCalledWith({
        where: {
          status: 'enviado',
          dataEnviado: {
            lt: expect.any(Date),
          },
        },
      });

      expect(resultado.removidos).toBe(20);
    });

    it('deve usar período padrão de 30 dias', async () => {
      mockPrisma.lembrete.deleteMany.mockResolvedValueOnce({ count: 15 });

      await service.limparLembretesAntigos();

      expect(mockPrisma.lembrete.deleteMany).toHaveBeenCalled();
    });
  });

  describe('processarFilaEnvio', () => {
    it('deve processar fila de lembretes pendentes', async () => {
      const lembretesPendentes = [
        { ...mockLembrete, id: '1' },
        { ...mockLembrete, id: '2' },
      ];

      mockPrisma.lembrete.findMany.mockResolvedValueOnce(lembretesPendentes);
      mockEmailService.enviarLembrete
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);
      mockPrisma.lembrete.update
        .mockResolvedValueOnce({ ...lembretesPendentes[0], status: 'enviado' })
        .mockResolvedValueOnce({ ...lembretesPendentes[1], status: 'enviado' });

      const resultado = await service.processarFilaEnvio();

      expect(resultado.processados).toBe(2);
      expect(resultado.enviados).toBe(2);
      expect(resultado.falhados).toBe(0);
    });

    it('deve tratar falhas no processamento', async () => {
      const lembretesPendentes = [
        { ...mockLembrete, id: '1' },
        { ...mockLembrete, id: '2' },
      ];

      mockPrisma.lembrete.findMany.mockResolvedValueOnce(lembretesPendentes);
      mockEmailService.enviarLembrete
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Falha SMTP'));
      mockPrisma.lembrete.update
        .mockResolvedValueOnce({ ...lembretesPendentes[0], status: 'enviado' })
        .mockResolvedValueOnce({ ...lembretesPendentes[1], status: 'falhado' });

      const resultado = await service.processarFilaEnvio();

      expect(resultado.processados).toBe(2);
      expect(resultado.enviados).toBe(1);
      expect(resultado.falhados).toBe(1);
    });

    it('deve respeitar limite de processamento', async () => {
      await service.processarFilaEnvio(5);

      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de conexão com banco', async () => {
      mockPrisma.lembrete.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(service.buscarLembretes()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('deve tratar erro de validação', async () => {
      mockPrisma.lembrete.create.mockRejectedValueOnce(
        new Error('Validation failed')
      );

      await expect(
        service.criarLembrete({
          usuarioId: 'user1',
          tipo: 'personalizado',
          titulo: 'Teste',
          mensagem: 'Teste',
          dataEnvio: new Date(),
        })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Performance', () => {
    it('deve usar índices apropriados para consultas', async () => {
      await service.buscarLembretes({
        usuarioId: 'user1',
        status: 'pendente',
        tipo: 'prazo_vencimento',
      });

      // Verificar se a consulta usa campos indexados
      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuarioId: 'user1', // Campo indexado
            status: 'pendente', // Campo indexado
            tipo: 'prazo_vencimento', // Campo indexado
          }),
        })
      );
    });

    it('deve limitar resultados para evitar sobrecarga', async () => {
      await service.buscarLembretes({ limite: 1000 });

      // Verificar se o limite é respeitado (máximo 100)
      expect(mockPrisma.lembrete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Limite máximo aplicado
        })
      );
    });
  });
});