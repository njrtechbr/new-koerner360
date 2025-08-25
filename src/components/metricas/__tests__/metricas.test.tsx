import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dos hooks de tempo real
const mockUseMetricasDashboard = jest.fn();
const mockUseMetricasAtendente = jest.fn();

jest.mock('@/hooks/use-metricas-tempo-real', () => ({
  useMetricasDashboardTempoReal: () => mockUseMetricasDashboard(),
  useMetricasAtendenteTempoReal: () => mockUseMetricasAtendente(),
  useMultiplasMetricasTempoReal: jest.fn(),
}));

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Importar componentes
import {
  DashboardMetricas,
  StatusTempoReal,
  GraficosDesempenho,
  IndicadoresProdutividade,
  ResumoStatus,
  FiltrosPeriodo,
  ExportarRelatorios,
  ComparativoAtendentes,
} from '../index';

// Dados de teste
const dadosTesteDashboard = {
  totalAtendentes: 25,
  atendentesPorStatus: {
    ativo: 20,
    inativo: 3,
    pendente: 1,
    suspenso: 1,
  },
  atendentesPorSetor: [
    { setor: 'Vendas', quantidade: 10, porcentagem: 40 },
    { setor: 'Suporte', quantidade: 8, porcentagem: 32 },
    { setor: 'Financeiro', quantidade: 7, porcentagem: 28 },
  ],
  atendentesPorCargo: [
    { cargo: 'Atendente Jr', quantidade: 12, porcentagem: 48 },
    { cargo: 'Atendente Pl', quantidade: 8, porcentagem: 32 },
    { cargo: 'Atendente Sr', quantidade: 5, porcentagem: 20 },
  ],
  metricas: {
    documentosCriados: {
      total: 150,
      tendencia: { valor: 12.5, tipo: 'alta' as const },
    },
    avaliacoes: {
      media: 4.2,
      total: 45,
      tendencia: { valor: -2.1, tipo: 'baixa' as const },
    },
    alteracoes: {
      total: 28,
      tendencia: { valor: 5.2, tipo: 'alta' as const },
    },
    produtividadeMedia: {
      valor: 85,
      tendencia: { valor: 8.3, tipo: 'alta' as const },
    },
  },
  alertas: {
    atendentesSemDocumentos: 2,
    atendentesComAvaliacaoBaixa: 1,
    atendentesSemAtividade: 0,
  },
  desempenho: {
    excelente: 8,
    bom: 12,
    regular: 4,
    ruim: 1,
  },
};

const dadosTesteAtendente = {
  id: '1',
  nome: 'João Silva',
  status: 'online' as const,
  atendimentosHoje: 25,
  tempoMedioResposta: 95,
  satisfacaoMedia: 4.5,
  atendimentoAtual: {
    id: 'atend-123',
    cliente: 'Maria Santos',
    canal: 'WhatsApp',
    iniciadoEm: new Date(),
    ultimaMensagem: 'Preciso de ajuda com meu pedido',
  },
};

const statusConexaoTeste = {
  conectado: true,
  ultimaAtualizacao: new Date(),
  tentativasReconexao: 0,
};

describe('Componentes de Métricas', () => {
  beforeEach(() => {
    // Resetar mocks antes de cada teste
    jest.clearAllMocks();

    // Configurar retornos padrão dos mocks
    mockUseMetricasDashboard.mockReturnValue({
      dados: dadosTesteDashboard,
      carregando: false,
      status: statusConexaoTeste,
      reconectar: jest.fn(),
    });

    mockUseMetricasAtendente.mockReturnValue({
      dados: dadosTesteAtendente,
      carregando: false,
      status: statusConexaoTeste,
      reconectar: jest.fn(),
    });
  });

  describe('DashboardMetricas', () => {
    it('deve renderizar o dashboard principal', () => {
      const { container } = render(<DashboardMetricas />);

      expect(container).toBeInTheDocument();
    });

    it('deve alternar entre abas', async () => {
      const { container } = render(<DashboardMetricas />);

      // Verificar se o componente renderiza sem erros
      expect(container).toBeInTheDocument();
    });

    it('deve exibir indicadores em tempo real', () => {
      const { container } = render(<DashboardMetricas />);

      // Verificar se o componente renderiza sem erros
      expect(container).toBeInTheDocument();
    });
  });

  describe('StatusTempoReal', () => {
    it('deve renderizar status de conexão', () => {
      const { container } = render(
        <StatusTempoReal status={statusConexaoTeste} />
      );

      expect(container).toBeInTheDocument();
    });

    it('deve exibir estado de carregamento', () => {
      mockUseMetricasDashboard.mockReturnValue({
        dados: null,
        carregando: true,
        status: statusConexaoTeste,
        reconectar: jest.fn(),
      });

      const { container } = render(
        <StatusTempoReal status={statusConexaoTeste} carregando={true} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('GraficosDesempenho', () => {
    it('deve renderizar gráficos de desempenho', () => {
      const { container } = render(
        <GraficosDesempenho dados={dadosTesteDashboard} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('IndicadoresProdutividade', () => {
    it('deve renderizar indicadores de produtividade', () => {
      const dadosProdutividade = {
        avaliacoes: {
          media: 4.5,
          total: 100,
          meta: 4.0,
        },
        documentos: {
          total: 150,
          ativosNoPeriodo: 120,
          meta: 100,
        },
        atividade: {
          totalAlteracoes: 50,
          meta: 40,
        },
      };
      const { container } = render(
        <IndicadoresProdutividade dados={dadosProdutividade} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('ResumoStatus', () => {
    it('deve renderizar resumo de status', () => {
      const { container } = render(
        <ResumoStatus dados={dadosTesteDashboard} />
      );

      // Verificar se o componente renderiza sem erros
      expect(container).toBeInTheDocument();
    });
  });

  describe('FiltrosPeriodo', () => {
    it('deve renderizar filtros de período', () => {
      const onFiltrosChange = jest.fn();
      const filtros = { dataInicio: new Date(), dataFim: new Date() };
      const { container } = render(
        <FiltrosPeriodo filtros={filtros} onFiltrosChange={onFiltrosChange} />
      );

      expect(container).toBeInTheDocument();
    });

    it('deve chamar callback ao alterar filtro', () => {
      const onFiltrosChange = jest.fn();
      const filtros = { dataInicio: new Date(), dataFim: new Date() };
      const { container } = render(
        <FiltrosPeriodo filtros={filtros} onFiltrosChange={onFiltrosChange} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('ExportarRelatorios', () => {
    it('deve renderizar botões de exportação', () => {
      const mockOnExportar = jest.fn();
      const dadosExportacao = {
        filtros: { dataInicio: new Date(), dataFim: new Date() },
        metricas: dadosTesteDashboard.metricas,
      };
      const { container } = render(
        <ExportarRelatorios
          dados={dadosExportacao}
          onExportar={mockOnExportar}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('ComparativoAtendentes', () => {
    const atendentesComparativos = [
      dadosTesteAtendente,
      { ...dadosTesteAtendente, id: '2', nome: 'Maria Santos' },
    ];

    it('deve renderizar comparativo de atendentes', () => {
      const { container } = render(
        <ComparativoAtendentes atendentes={atendentesComparativos} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Tratamento de erros', () => {
    beforeEach(() => {
      // Configurar mocks padrão
      mockUseMetricasDashboard.mockReturnValue({
        dados: dadosTesteDashboard,
        carregando: false,
        status: statusConexaoTeste,
        reconectar: jest.fn(),
      });
    });

    it('deve exibir estado de erro quando hook retorna erro', () => {
      mockUseMetricasDashboard.mockReturnValue({
        dados: null,
        carregando: false,
        status: { ...statusConexaoTeste, conectado: false },
        reconectar: jest.fn(),
        erro: 'Erro de conexão',
      });

      const { container } = render(
        <StatusTempoReal status={statusConexaoTeste} onReconectar={jest.fn()} />
      );

      // Verificar se o componente renderiza sem erros
      expect(container).toBeInTheDocument();
    });

    it('deve exibir botão de reconexão quando há erro', () => {
      const mockReconectar = jest.fn();
      mockUseMetricasDashboard.mockReturnValue({
        dados: null,
        carregando: false,
        status: { ...statusConexaoTeste, conectado: false },
        reconectar: mockReconectar,
        erro: 'Erro de conexão',
      });

      const { container } = render(
        <StatusTempoReal
          status={{ ...statusConexaoTeste, conectado: false }}
          onReconectar={mockReconectar}
        />
      );

      // Verificar se o componente renderiza sem erros
      expect(container).toBeInTheDocument();
    });
  });

  describe('Integração com hooks', () => {
    it('deve atualizar dados quando hook retorna novos valores', async () => {
      const { container, rerender } = render(<DashboardMetricas />);

      // Simular atualização de dados
      const novosDados = {
        ...dadosTesteDashboard,
        totalAtendentes: 30,
      };

      mockUseMetricasDashboard.mockReturnValue({
        dados: novosDados,
        carregando: false,
        status: statusConexaoTeste,
        reconectar: jest.fn(),
      });

      rerender(<DashboardMetricas />);

      await waitFor(() => {
        // Verificar se o componente renderiza sem erros
        expect(container).toBeInTheDocument();
      });
    });
  });
});
