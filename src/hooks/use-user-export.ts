'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Usuario } from '@/types/usuario';

export type FormatoExportacao = 'csv' | 'json' | 'xlsx';

export interface OpcoesExportacao {
  formato: FormatoExportacao;
  incluirCampos?: string[];
  excluirCampos?: string[];
  filtros?: {
    status?: 'ativo' | 'inativo';
    tipo?: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
    dataInicio?: string;
    dataFim?: string;
  };
  nomeArquivo?: string;
}

export interface UseUserExportReturn {
  exportando: boolean;
  progresso: number;
  exportarUsuarios: (
    usuarios: Usuario[],
    opcoes: OpcoesExportacao
  ) => Promise<void>;
  exportarTodosUsuarios: (opcoes: OpcoesExportacao) => Promise<void>;
  baixarTemplate: (formato: FormatoExportacao) => void;
  cancelarExportacao: () => void;
}

export function useUserExport(): UseUserExportReturn {
  const [exportando, setExportando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [controladorAbort, setControladorAbort] =
    useState<AbortController | null>(null);

  const gerarNomeArquivo = (
    formato: FormatoExportacao,
    prefixo: string = 'usuarios'
  ): string => {
    const agora = new Date();
    const timestamp = agora.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `${prefixo}_${timestamp}.${formato}`;
  };

  const filtrarCampos = (
    usuario: Usuario,
    opcoes: OpcoesExportacao
  ): Partial<Usuario> => {
    const { incluirCampos, excluirCampos } = opcoes;

    if (incluirCampos && incluirCampos.length > 0) {
      const usuarioFiltrado: Partial<Usuario> = {};
      incluirCampos.forEach(campo => {
        if (campo in usuario) {
          (usuarioFiltrado as any)[campo] = (usuario as any)[campo];
        }
      });
      return usuarioFiltrado;
    }

    if (excluirCampos && excluirCampos.length > 0) {
      const usuarioFiltrado = { ...usuario };
      excluirCampos.forEach(campo => {
        delete (usuarioFiltrado as any)[campo];
      });
      return usuarioFiltrado;
    }

    return usuario;
  };

  const aplicarFiltros = (
    usuarios: Usuario[],
    opcoes: OpcoesExportacao
  ): Usuario[] => {
    const { filtros } = opcoes;

    if (!filtros) return usuarios;

    return usuarios.filter(usuario => {
      if (filtros.status && usuario.ativo !== (filtros.status === 'ativo')) {
        return false;
      }

      if (filtros.tipo && usuario.tipo !== filtros.tipo) {
        return false;
      }

      if (filtros.dataInicio) {
        const dataUsuario = new Date(usuario.criadoEm);
        const dataInicio = new Date(filtros.dataInicio);
        if (dataUsuario < dataInicio) {
          return false;
        }
      }

      if (filtros.dataFim) {
        const dataUsuario = new Date(usuario.criadoEm);
        const dataFim = new Date(filtros.dataFim);
        if (dataUsuario > dataFim) {
          return false;
        }
      }

      return true;
    });
  };

  const exportarParaCSV = (
    dados: Partial<Usuario>[],
    nomeArquivo: string
  ): void => {
    if (dados.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const cabecalhos = Object.keys(dados[0]);
    const linhasCabecalho = cabecalhos.join(',');

    const linhasDados = dados.map(item =>
      cabecalhos
        .map(cabecalho => {
          const valor = (item as any)[cabecalho];
          if (valor === null || valor === undefined) return '';
          if (typeof valor === 'string' && valor.includes(',')) {
            return `"${valor.replace(/"/g, '""')}"`;
          }
          return valor;
        })
        .join(',')
    );

    const csvContent = [linhasCabecalho, ...linhasDados].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const exportarParaJSON = (
    dados: Partial<Usuario>[],
    nomeArquivo: string
  ): void => {
    if (dados.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const jsonContent = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const exportarParaXLSX = async (
    dados: Partial<Usuario>[],
    nomeArquivo: string
  ): Promise<void> => {
    try {
      // Importação dinâmica para reduzir o bundle size
      const XLSX = await import('xlsx');

      if (dados.length === 0) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dados);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários');

      XLSX.writeFile(workbook, nomeArquivo);
    } catch (error) {
      console.error('Erro ao exportar para XLSX:', error);
      toast.error(
        'Erro ao exportar arquivo Excel. Verifique se a biblioteca está instalada.'
      );
    }
  };

  const exportarUsuarios = async (
    usuarios: Usuario[],
    opcoes: OpcoesExportacao
  ): Promise<void> => {
    if (exportando) {
      toast.warning('Já existe uma exportação em andamento');
      return;
    }

    try {
      setExportando(true);
      setProgresso(0);

      const controller = new AbortController();
      setControladorAbort(controller);

      // Simular progresso
      setProgresso(10);

      // Aplicar filtros
      const usuariosFiltrados = aplicarFiltros(usuarios, opcoes);
      setProgresso(30);

      if (controller.signal.aborted) return;

      // Filtrar campos
      const dadosProcessados = usuariosFiltrados.map(usuario =>
        filtrarCampos(usuario, opcoes)
      );
      setProgresso(60);

      if (controller.signal.aborted) return;

      const nomeArquivo =
        opcoes.nomeArquivo || gerarNomeArquivo(opcoes.formato);

      // Exportar conforme o formato
      switch (opcoes.formato) {
        case 'csv':
          exportarParaCSV(dadosProcessados, nomeArquivo);
          break;
        case 'json':
          exportarParaJSON(dadosProcessados, nomeArquivo);
          break;
        case 'xlsx':
          await exportarParaXLSX(dadosProcessados, nomeArquivo);
          break;
        default:
          throw new Error(`Formato não suportado: ${opcoes.formato}`);
      }

      setProgresso(100);

      if (!controller.signal.aborted) {
        toast.success(`Arquivo exportado com sucesso: ${nomeArquivo}`);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar dados dos usuários');
    } finally {
      setExportando(false);
      setProgresso(0);
      setControladorAbort(null);
    }
  };

  const exportarTodosUsuarios = async (
    opcoes: OpcoesExportacao
  ): Promise<void> => {
    try {
      setExportando(true);
      setProgresso(0);

      // Buscar todos os usuários da API
      const response = await fetch('/api/usuarios?limite=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }

      const data = await response.json();
      setProgresso(20);

      await exportarUsuarios(data.usuarios || [], opcoes);
    } catch (error) {
      console.error('Erro ao buscar usuários para exportação:', error);
      toast.error('Erro ao buscar dados dos usuários');
      setExportando(false);
      setProgresso(0);
    }
  };

  const baixarTemplate = (formato: FormatoExportacao): void => {
    const templateData = [
      {
        id: 'exemplo',
        nome: 'Nome do Usuário',
        email: 'usuario@exemplo.com',
        tipo: 'ATENDENTE',
        ativo: true,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    ];

    const nomeArquivo = gerarNomeArquivo(formato, 'template_usuarios');

    switch (formato) {
      case 'csv':
        exportarParaCSV(templateData, nomeArquivo);
        break;
      case 'json':
        exportarParaJSON(templateData, nomeArquivo);
        break;
      case 'xlsx':
        exportarParaXLSX(templateData, nomeArquivo);
        break;
    }

    toast.success(`Template baixado: ${nomeArquivo}`);
  };

  const cancelarExportacao = (): void => {
    if (controladorAbort) {
      controladorAbort.abort();
      setControladorAbort(null);
      setExportando(false);
      setProgresso(0);
      toast.info('Exportação cancelada');
    }
  };

  return {
    exportando,
    progresso,
    exportarUsuarios,
    exportarTodosUsuarios,
    baixarTemplate,
    cancelarExportacao,
  };
}

export default useUserExport;
