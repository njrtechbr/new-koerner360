'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useUsuarios,
  type ParametrosListagem,
  type Usuario,
  type PaginacaoInfo,
} from './use-usuarios';
import { useDebounce } from './use-debounce';

// Tipos para filtros de busca
export interface FiltrosBusca {
  termo: string;
  perfil: 'ADMIN' | 'GESTOR' | 'ATENDENTE' | 'TODOS';
  status: 'ATIVO' | 'INATIVO' | 'TODOS';
  dataInicio?: string;
  dataFim?: string;
  ordenarPor: 'nome' | 'email' | 'criadoEm' | 'atualizadoEm';
  ordem: 'asc' | 'desc';
}

export interface ConfiguracaoPaginacao {
  paginaAtual: number;
  itensPorPagina: number;
}

export interface ResultadoBusca {
  usuarios: Usuario[];
  paginacao: PaginacaoInfo | null;
  totalEncontrados: number;
  tempoResposta?: number;
}

export interface HistoricoBusca {
  id: string;
  termo: string;
  filtros: FiltrosBusca;
  timestamp: Date;
  resultados: number;
}

/**
 * Hook personalizado para debounce
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para busca avançada de usuários
 * Fornece funcionalidades de busca, filtros, paginação e histórico
 */
export function useUserSearch() {
  const { listarUsuarios, carregando, erro } = useUsuarios();

  // Estado dos filtros
  const [filtros, setFiltros] = useState<FiltrosBusca>({
    termo: '',
    perfil: 'TODOS',
    status: 'TODOS',
    ordenarPor: 'nome',
    ordem: 'asc',
  });

  // Estado da paginação
  const [paginacao, setPaginacao] = useState<ConfiguracaoPaginacao>({
    paginaAtual: 1,
    itensPorPagina: 10,
  });

  // Estado dos resultados
  const [resultados, setResultados] = useState<ResultadoBusca>({
    usuarios: [],
    paginacao: null,
    totalEncontrados: 0,
  });

  // Estado do histórico
  const [historico, setHistorico] = useState<HistoricoBusca[]>([]);

  // Estado de busca ativa
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [ultimaBusca, setUltimaBusca] = useState<Date | null>(null);

  // Debounce do termo de busca
  const termoBuscaDebounced = useDebounce(filtros.termo, 500);

  // Filtros ativos (excluindo valores padrão)
  const filtrosAtivos = useMemo(() => {
    const ativos: string[] = [];

    if (filtros.termo.trim()) ativos.push(`Termo: "${filtros.termo}"`);
    if (filtros.perfil !== 'TODOS') ativos.push(`Perfil: ${filtros.perfil}`);
    if (filtros.status !== 'TODOS') ativos.push(`Status: ${filtros.status}`);
    if (filtros.dataInicio) ativos.push(`Data início: ${filtros.dataInicio}`);
    if (filtros.dataFim) ativos.push(`Data fim: ${filtros.dataFim}`);
    if (filtros.ordenarPor !== 'nome' || filtros.ordem !== 'asc') {
      ativos.push(`Ordenação: ${filtros.ordenarPor} (${filtros.ordem})`);
    }

    return ativos;
  }, [filtros]);

  /**
   * Converter filtros para parâmetros da API
   */
  const converterFiltrosParaParametros = useCallback(
    (
      filtrosBusca: FiltrosBusca,
      config: ConfiguracaoPaginacao
    ): ParametrosListagem => {
      const parametros: ParametrosListagem = {
        pagina: config.paginaAtual,
        limite: config.itensPorPagina,
        ordenarPor: filtrosBusca.ordenarPor,
        ordem: filtrosBusca.ordem,
      };

      if (filtrosBusca.termo.trim()) {
        parametros.busca = filtrosBusca.termo.trim();
      }

      if (filtrosBusca.perfil !== 'TODOS') {
        parametros.perfil = filtrosBusca.perfil;
      }

      if (filtrosBusca.status !== 'TODOS') {
        parametros.ativo = filtrosBusca.status === 'ATIVO';
      }

      return parametros;
    },
    []
  );

  /**
   * Executar busca
   */
  const executarBusca = useCallback(
    async (
      filtrosBusca?: FiltrosBusca,
      configPaginacao?: ConfiguracaoPaginacao
    ) => {
      const filtrosUsados = filtrosBusca || filtros;
      const paginacaoUsada = configPaginacao || paginacao;

      try {
        setBuscaAtiva(true);
        const inicioTempo = Date.now();

        const parametros = converterFiltrosParaParametros(
          filtrosUsados,
          paginacaoUsada
        );
        const resposta = await listarUsuarios(parametros);

        const tempoResposta = Date.now() - inicioTempo;

        const novoResultado: ResultadoBusca = {
          usuarios: resposta.usuarios,
          paginacao: resposta.paginacao,
          totalEncontrados: resposta.paginacao.totalItens,
          tempoResposta,
        };

        setResultados(novoResultado);
        setUltimaBusca(new Date());

        // Adicionar ao histórico se houver termo de busca
        if (filtrosUsados.termo.trim()) {
          const novoHistorico: HistoricoBusca = {
            id: Date.now().toString(),
            termo: filtrosUsados.termo,
            filtros: { ...filtrosUsados },
            timestamp: new Date(),
            resultados: resposta.paginacao.totalItens,
          };

          setHistorico(prev => [novoHistorico, ...prev.slice(0, 9)]); // Manter apenas 10 itens
        }

        return novoResultado;
      } catch (error) {
        console.error('Erro na busca:', error);
        throw error;
      } finally {
        setBuscaAtiva(false);
      }
    },
    [filtros, paginacao, converterFiltrosParaParametros, listarUsuarios]
  );

  /**
   * Atualizar filtro específico
   */
  const atualizarFiltro = useCallback(
    <K extends keyof FiltrosBusca>(campo: K, valor: FiltrosBusca[K]) => {
      setFiltros(prev => ({ ...prev, [campo]: valor }));

      // Reset da paginação quando filtros mudam
      if (campo !== 'ordenarPor' && campo !== 'ordem') {
        setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
      }
    },
    []
  );

  /**
   * Atualizar múltiplos filtros
   */
  const atualizarFiltros = useCallback(
    (novosFiltros: Partial<FiltrosBusca>) => {
      setFiltros(prev => ({ ...prev, ...novosFiltros }));
      setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    },
    []
  );

  /**
   * Limpar todos os filtros
   */
  const limparFiltros = useCallback(() => {
    setFiltros({
      termo: '',
      perfil: 'TODOS',
      status: 'TODOS',
      ordenarPor: 'nome',
      ordem: 'asc',
    });
    setPaginacao({ paginaAtual: 1, itensPorPagina: 10 });
  }, []);

  /**
   * Ir para página específica
   */
  const irParaPagina = useCallback((pagina: number) => {
    setPaginacao(prev => ({ ...prev, paginaAtual: pagina }));
  }, []);

  /**
   * Alterar itens por página
   */
  const alterarItensPorPagina = useCallback((quantidade: number) => {
    setPaginacao({ paginaAtual: 1, itensPorPagina: quantidade });
  }, []);

  /**
   * Aplicar busca do histórico
   */
  const aplicarBuscaHistorico = useCallback(
    (item: HistoricoBusca) => {
      setFiltros(item.filtros);
      setPaginacao({
        paginaAtual: 1,
        itensPorPagina: paginacao.itensPorPagina,
      });
    },
    [paginacao.itensPorPagina]
  );

  /**
   * Remover item do histórico
   */
  const removerDoHistorico = useCallback((id: string) => {
    setHistorico(prev => prev.filter(item => item.id !== id));
  }, []);

  /**
   * Limpar histórico
   */
  const limparHistorico = useCallback(() => {
    setHistorico([]);
  }, []);

  /**
   * Exportar resultados da busca
   */
  const exportarResultados = useCallback(
    (formato: 'csv' | 'json' = 'csv') => {
      if (resultados.usuarios.length === 0) {
        throw new Error('Nenhum resultado para exportar');
      }

      const dados = resultados.usuarios.map(usuario => ({
        ID: usuario.id,
        Nome: usuario.nome,
        Email: usuario.email,
        Perfil: usuario.perfil,
        Status: usuario.ativo ? 'Ativo' : 'Inativo',
        'Criado em': new Date(usuario.criadoEm).toLocaleDateString('pt-BR'),
        'Atualizado em': new Date(usuario.atualizadoEm).toLocaleDateString(
          'pt-BR'
        ),
      }));

      if (formato === 'csv') {
        const cabecalho = Object.keys(dados[0]).join(',');
        const linhas = dados.map(linha => Object.values(linha).join(','));
        const csv = [cabecalho, ...linhas].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `usuarios_busca_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        const json = JSON.stringify(dados, null, 2);
        const blob = new Blob([json], {
          type: 'application/json;charset=utf-8;',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `usuarios_busca_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
    },
    [resultados.usuarios]
  );

  // Executar busca automaticamente quando filtros com debounce mudarem
  useEffect(() => {
    if (termoBuscaDebounced !== filtros.termo) {
      return; // Aguardar debounce
    }

    executarBusca();
  }, [
    termoBuscaDebounced,
    filtros.perfil,
    filtros.status,
    filtros.dataInicio,
    filtros.dataFim,
    filtros.ordenarPor,
    filtros.ordem,
    paginacao,
  ]);

  return {
    // Estado
    filtros,
    paginacao,
    resultados,
    historico,
    filtrosAtivos,
    buscaAtiva,
    ultimaBusca,
    carregando,
    erro,

    // Ações de filtros
    atualizarFiltro,
    atualizarFiltros,
    limparFiltros,

    // Ações de paginação
    irParaPagina,
    alterarItensPorPagina,

    // Ações de busca
    executarBusca,

    // Ações de histórico
    aplicarBuscaHistorico,
    removerDoHistorico,
    limparHistorico,

    // Utilitários
    exportarResultados,

    // Computed
    temFiltrosAtivos: filtrosAtivos.length > 0,
    temResultados: resultados.usuarios.length > 0,
    podeExportar: resultados.usuarios.length > 0,
  };
}

export default useUserSearch;
