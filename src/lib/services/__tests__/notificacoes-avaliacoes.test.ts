import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NotificacoesAvaliacoesService } from '../notificacoes-avaliacoes';
import { TipoNotificacao, UrgenciaNotificacao, StatusNotificacao } from '../../types/notificacao-avaliacao';

// Mock do Prisma
const mockPrisma = {
  notificacaoAvaliacao: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  usuario: {
    findMany: jest.fn(),
  },
  avaliacao: {
    findMany: jest.fn(),
  },
};

// Mock das notificações de teste
const mockNotificacao = {
  id: '1',
  usuarioId: 'user1',
  avaliacaoId: 'aval1',
  tipo: 'pendente' as TipoNotificacao,
  urgencia: 'media' as UrgenciaNotificacao,
  status: 'nao_lida' as StatusNotificacao,
  titulo: 'Avaliação Pendente',
  mensagem: 'Você tem uma avaliação pendente para completar.',
  link: '/avaliacoes/aval1',
  metadados: {
    nomeAvaliacao: 'Avaliação Anual 2024',
    prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    avaliador: 'João Silva',
  },
  dataLeitura: null,
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const mockNotificacoes = [
  mockNotificacao,
  {
    ...mockNotificacao,
    id: '2',
    tipo: 'vencida' as TipoNotificacao,
    urgencia: 'alta' as UrgenciaNotificacao,
    status: 'lida' as StatusNotificacao,
    dataLeitura: new Date().toISOString(),
  },
  {
    ...mockNotificacao,
    id: '3',
    tipo: 'proxima_vencimento' as TipoNotificacao,
    urgencia: 'baixa' as UrgenciaNotificacao,
  },
];

const mockEstatisticas = {
  total: 25,
  naoLidas: 8,
  lidas: 17,
  porTipo: {
    pendente: 10,
    vencida: 5,
    proxima_vencimento: 7,
    nova: 2,
    completada: 1,
  },
  porUrgencia: {
    baixa: 8,
    media: 12,
    alta: 5,
  },
  ultimosPeriodos: {
    hoje: 3,
    ontem: 5,
    ultimaSemana: 15,
    ultimoMes: 25,
  },
};

describe('NotificacoesAvaliacoesService', () => {
  let service: NotificacoesAvaliacoesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificacoesAvaliacoesService(mockPrisma as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('buscarNotificacoes', () => {
    it('deve buscar notificações com filtros padrão', async () => {
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce(mockNotificacoes);
      mockPrisma.notificacaoAvaliacao.count.mockResolvedValueOnce(3);

      const resultado = await service.buscarNotificacoes('user1');

      expect(mockPrisma.notificacaoAvaliacao.findMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1',
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
          criadaEm: 'desc',
        },
        skip: 0,
        take: 20,
      });

      expect(resultado.notificacoes).toEqual(mockNotificacoes);
      expect(resultado.total).toBe(3);
    });

    it('deve aplicar filtros específicos', async () => {
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce([mockNotificacao]);
      mockPrisma.notificacaoAvaliacao.count.mockResolvedValueOnce(1);

      const filtros = {
        tipo: 'pendente' as TipoNotificacao,
        urgencia: 'alta' as UrgenciaNotificacao,
        status: 'nao_lida' as StatusNotificacao,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        pagina: 2,
        limite: 10,
      };

      await service.buscarNotificacoes('user1', filtros);

      expect(mockPrisma.notificacaoAvaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuarioId: 'user1',
            tipo: 'pendente',
            urgencia: 'alta',
            status: 'nao_lida',
            criadaEm: {
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
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce([mockNotificacao]);
      mockPrisma.notificacaoAvaliacao.count.mockResolvedValueOnce(1);

      await service.buscarNotificacoes('user1', { busca: 'avaliação' });

      expect(mockPrisma.notificacaoAvaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuarioId: 'user1',
            OR: [
              { titulo: { contains: 'avaliação', mode: 'insensitive' } },
              { mensagem: { contains: 'avaliação', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('deve aplicar ordenação personalizada', async () => {
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce(mockNotificacoes);
      mockPrisma.notificacaoAvaliacao.count.mockResolvedValueOnce(3);

      await service.buscarNotificacoes('user1', {
        ordenarPor: 'urgencia',
        ordem: 'asc',
      });

      expect(mockPrisma.notificacaoAvaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            urgencia: 'asc',
          },
        })
      );
    });
  });

  describe('buscarNotificacao', () => {
    it('deve buscar notificação por ID', async () => {
      mockPrisma.notificacaoAvaliacao.findUnique.mockResolvedValueOnce(mockNotificacao);

      const resultado = await service.buscarNotificacao('1', 'user1');

      expect(mockPrisma.notificacaoAvaliacao.findUnique).toHaveBeenCalledWith({
        where: {
          id: '1',
          usuarioId: 'user1',
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

      expect(resultado).toEqual(mockNotificacao);
    });

    it('deve retornar null se notificação não encontrada', async () => {
      mockPrisma.notificacaoAvaliacao.findUnique.mockResolvedValueOnce(null);

      const resultado = await service.buscarNotificacao('999', 'user1');

      expect(resultado).toBeNull();
    });
  });

  describe('marcarComoLida', () => {
    it('deve marcar notificação como lida', async () => {
      const notificacaoLida = {
        ...mockNotificacao,
        status: 'lida' as StatusNotificacao,
        dataLeitura: new Date().toISOString(),
      };

      mockPrisma.notificacaoAvaliacao.update.mockResolvedValueOnce(notificacaoLida);

      const resultado = await service.marcarComoLida('1', 'user1');

      expect(mockPrisma.notificacaoAvaliacao.update).toHaveBeenCalledWith({
        where: {
          id: '1',
          usuarioId: 'user1',
        },
        data: {
          status: 'lida',
          dataLeitura: expect.any(Date),
        },
      });

      expect(resultado.status).toBe('lida');
      expect(resultado.dataLeitura).toBeTruthy();
    });

    it('deve lançar erro se notificação não encontrada', async () => {
      mockPrisma.notificacaoAvaliacao.update.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(service.marcarComoLida('999', 'user1')).rejects.toThrow();
    });
  });

  describe('marcarTodasComoLidas', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      mockPrisma.notificacaoAvaliacao.updateMany.mockResolvedValueOnce({ count: 5 });

      const resultado = await service.marcarTodasComoLidas('user1');

      expect(mockPrisma.notificacaoAvaliacao.updateMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1',
          status: 'nao_lida',
        },
        data: {
          status: 'lida',
          dataLeitura: expect.any(Date),
        },
      });

      expect(resultado.marcadas).toBe(5);
    });

    it('deve marcar notificações filtradas como lidas', async () => {
      mockPrisma.notificacaoAvaliacao.updateMany.mockResolvedValueOnce({ count: 3 });

      const filtros = {
        tipo: 'pendente' as TipoNotificacao,
        urgencia: 'alta' as UrgenciaNotificacao,
      };

      await service.marcarTodasComoLidas('user1', filtros);

      expect(mockPrisma.notificacaoAvaliacao.updateMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1',
          status: 'nao_lida',
          tipo: 'pendente',
          urgencia: 'alta',
        },
        data: {
          status: 'lida',
          dataLeitura: expect.any(Date),
        },
      });
    });
  });

  describe('removerNotificacao', () => {
    it('deve remover notificação', async () => {
      mockPrisma.notificacaoAvaliacao.delete.mockResolvedValueOnce(mockNotificacao);

      const resultado = await service.removerNotificacao('1', 'user1');

      expect(mockPrisma.notificacaoAvaliacao.delete).toHaveBeenCalledWith({
        where: {
          id: '1',
          usuarioId: 'user1',
        },
      });

      expect(resultado).toEqual(mockNotificacao);
    });

    it('deve lançar erro se notificação não encontrada', async () => {
      mockPrisma.notificacaoAvaliacao.delete.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(service.removerNotificacao('999', 'user1')).rejects.toThrow();
    });
  });

  describe('limparNotificacoesLidas', () => {
    it('deve remover todas as notificações lidas', async () => {
      mockPrisma.notificacaoAvaliacao.deleteMany.mockResolvedValueOnce({ count: 10 });

      const resultado = await service.limparNotificacoesLidas('user1');

      expect(mockPrisma.notificacaoAvaliacao.deleteMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1',
          status: 'lida',
        },
      });

      expect(resultado.removidas).toBe(10);
    });

    it('deve remover notificações lidas com filtros', async () => {
      mockPrisma.notificacaoAvaliacao.deleteMany.mockResolvedValueOnce({ count: 5 });

      const filtros = {
        tipo: 'completada' as TipoNotificacao,
        dataInicio: '2024-01-01',
        dataFim: '2024-06-30',
      };

      await service.limparNotificacoesLidas('user1', filtros);

      expect(mockPrisma.notificacaoAvaliacao.deleteMany).toHaveBeenCalledWith({
        where: {
          usuarioId: 'user1',
          status: 'lida',
          tipo: 'completada',
          criadaEm: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-06-30'),
          },
        },
      });
    });
  });

  describe('buscarEstatisticas', () => {
    it('deve buscar estatísticas básicas', async () => {
      mockPrisma.notificacaoAvaliacao.count.mockImplementation(({ where }) => {
        if (where?.status === 'nao_lida') return Promise.resolve(8);
        if (where?.status === 'lida') return Promise.resolve(17);
        return Promise.resolve(25);
      });

      mockPrisma.notificacaoAvaliacao.aggregate.mockResolvedValueOnce({
        _count: {
          tipo: {
            pendente: 10,
            vencida: 5,
            proxima_vencimento: 7,
            nova: 2,
            completada: 1,
          },
          urgencia: {
            baixa: 8,
            media: 12,
            alta: 5,
          },
        },
      });

      const resultado = await service.buscarEstatisticas('user1');

      expect(resultado.total).toBe(25);
      expect(resultado.naoLidas).toBe(8);
      expect(resultado.lidas).toBe(17);
    });

    it('deve buscar estatísticas com filtros', async () => {
      mockPrisma.notificacaoAvaliacao.count.mockResolvedValueOnce(15);

      const filtros = {
        tipo: 'pendente' as TipoNotificacao,
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
      };

      await service.buscarEstatisticas('user1', filtros);

      expect(mockPrisma.notificacaoAvaliacao.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usuarioId: 'user1',
            tipo: 'pendente',
            criadaEm: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
        })
      );
    });
  });

  describe('gerarNotificacoes', () => {
    it('deve gerar notificações para avaliações pendentes', async () => {
      const mockAvaliacoes = [
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

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(mockAvaliacoes);
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce([]);
      mockPrisma.notificacaoAvaliacao.create.mockResolvedValueOnce(mockNotificacao);

      const resultado = await service.gerarNotificacoes();

      expect(mockPrisma.notificacaoAvaliacao.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          usuarioId: 'user1',
          avaliacaoId: 'aval1',
          tipo: 'pendente',
          urgencia: 'media',
          titulo: expect.stringContaining('Avaliação pendente'),
          mensagem: expect.any(String),
          link: '/avaliacoes/aval1',
          metadados: expect.any(Object),
        }),
      });

      expect(resultado.geradas).toBe(1);
    });

    it('deve determinar urgência baseada no prazo', async () => {
      const mockAvaliacoes = [
        {
          id: 'aval1',
          titulo: 'Avaliação Crítica',
          prazo: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 horas
          status: 'pendente',
          usuarioId: 'user1',
          usuario: {
            id: 'user1',
            nome: 'João Silva',
            email: 'joao@empresa.com',
          },
        },
      ];

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(mockAvaliacoes);
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce([]);
      mockPrisma.notificacaoAvaliacao.create.mockResolvedValueOnce(mockNotificacao);

      await service.gerarNotificacoes();

      expect(mockPrisma.notificacaoAvaliacao.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          urgencia: 'alta', // Menos de 1 dia
        }),
      });
    });

    it('deve evitar duplicar notificações existentes', async () => {
      const mockAvaliacoes = [
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

      mockPrisma.avaliacao.findMany.mockResolvedValueOnce(mockAvaliacoes);
      mockPrisma.notificacaoAvaliacao.findMany.mockResolvedValueOnce([mockNotificacao]);

      const resultado = await service.gerarNotificacoes();

      expect(mockPrisma.notificacaoAvaliacao.create).not.toHaveBeenCalled();
      expect(resultado.geradas).toBe(0);
      expect(resultado.duplicadas).toBe(1);
    });
  });

  describe('limparNotificacoesAntigas', () => {
    it('deve remover notificações antigas', async () => {
      mockPrisma.notificacaoAvaliacao.deleteMany.mockResolvedValueOnce({ count: 15 });

      const resultado = await service.limparNotificacoesAntigas(30);

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      expect(mockPrisma.notificacaoAvaliacao.deleteMany).toHaveBeenCalledWith({
        where: {
          criadaEm: {
            lt: expect.any(Date),
          },
          status: 'lida',
        },
      });

      expect(resultado.removidas).toBe(15);
    });

    it('deve usar período padrão de 90 dias', async () => {
      mockPrisma.notificacaoAvaliacao.deleteMany.mockResolvedValueOnce({ count: 20 });

      await service.limparNotificacoesAntigas();

      expect(mockPrisma.notificacaoAvaliacao.deleteMany).toHaveBeenCalled();
    });
  });

  describe('buscarUsuariosComNotificacoesPendentes', () => {
    it('deve buscar usuários com notificações não lidas', async () => {
      const mockUsuarios = [
        {
          id: 'user1',
          nome: 'João Silva',
          email: 'joao@empresa.com',
          _count: {
            notificacoesAvaliacao: 5,
          },
        },
      ];

      mockPrisma.usuario.findMany.mockResolvedValueOnce(mockUsuarios);

      const resultado = await service.buscarUsuariosComNotificacoesPendentes();

      expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith({
        where: {
          notificacoesAvaliacao: {
            some: {
              status: 'nao_lida',
            },
          },
        },
        select: {
          id: true,
          nome: true,
          email: true,
          _count: {
            select: {
              notificacoesAvaliacao: {
                where: {
                  status: 'nao_lida',
                },
              },
            },
          },
        },
      });

      expect(resultado).toEqual(mockUsuarios);
    });

    it('deve filtrar por urgência mínima', async () => {
      await service.buscarUsuariosComNotificacoesPendentes('alta');

      expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            notificacoesAvaliacao: {
              some: {
                status: 'nao_lida',
                urgencia: 'alta',
              },
            },
          },
        })
      );
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de conexão com banco', async () => {
      mockPrisma.notificacaoAvaliacao.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(service.buscarNotificacoes('user1')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('deve tratar erro de validação', async () => {
      mockPrisma.notificacaoAvaliacao.create.mockRejectedValueOnce(
        new Error('Validation failed')
      );

      await expect(
        service.gerarNotificacoes()
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Performance', () => {
    it('deve usar índices apropriados para consultas', async () => {
      await service.buscarNotificacoes('user1', {
        tipo: 'pendente',
        status: 'nao_lida',
      });

      // Verificar se a consulta usa campos indexados
      expect(mockPrisma.notificacaoAvaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuarioId: 'user1', // Campo indexado
            tipo: 'pendente', // Campo indexado
            status: 'nao_lida', // Campo indexado
          }),
        })
      );
    });

    it('deve limitar resultados para evitar sobrecarga', async () => {
      await service.buscarNotificacoes('user1', { limite: 1000 });

      // Verificar se o limite é respeitado (máximo 100)
      expect(mockPrisma.notificacaoAvaliacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Limite máximo aplicado
        })
      );
    });
  });
});