'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Tipos para usuários
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  ultimoLogin?: string;
}

export interface CriarUsuarioData {
  nome: string;
  email: string;
  senha: string;
  perfil: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
  ativo?: boolean;
}

export interface AtualizarUsuarioData {
  nome?: string;
  email?: string;
  perfil?: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
  ativo?: boolean;
}

export interface ParametrosListagem {
  pagina?: number;
  limite?: number;
  busca?: string;
  perfil?: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
  ativo?: boolean;
  ordenarPor?: 'nome' | 'email' | 'criadoEm' | 'atualizadoEm';
  ordem?: 'asc' | 'desc';
}

export interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  temProxima: boolean;
  temAnterior: boolean;
}

export interface RespostaListagem {
  usuarios: Usuario[];
  paginacao: PaginacaoInfo;
}

/**
 * Hook para gerenciamento de usuários
 * Fornece funcionalidades CRUD completas para usuários
 */
export function useUsuarios() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Função auxiliar para fazer requisições à API
   */
  const fazerRequisicao = useCallback(
    async (url: string, opcoes: RequestInit = {}) => {
      const resposta = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...opcoes.headers,
        },
        ...opcoes,
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.erro || 'Erro na requisição');
      }

      return resposta.json();
    },
    []
  );

  /**
   * Listar usuários com paginação e filtros
   */
  const listarUsuarios = useCallback(
    async (parametros: ParametrosListagem = {}) => {
      try {
        setCarregando(true);
        setErro(null);

        const searchParams = new URLSearchParams();

        if (parametros.pagina)
          searchParams.set('pagina', parametros.pagina.toString());
        if (parametros.limite)
          searchParams.set('limite', parametros.limite.toString());
        if (parametros.busca) searchParams.set('busca', parametros.busca);
        if (parametros.perfil) searchParams.set('perfil', parametros.perfil);
        if (parametros.ativo !== undefined)
          searchParams.set('ativo', parametros.ativo.toString());
        if (parametros.ordenarPor)
          searchParams.set('ordenarPor', parametros.ordenarPor);
        if (parametros.ordem) searchParams.set('ordem', parametros.ordem);

        const url = `/api/usuarios?${searchParams.toString()}`;
        const dados: RespostaListagem = await fazerRequisicao(url);

        setUsuarios(dados.usuarios);
        setPaginacao(dados.paginacao);

        return dados;
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao listar usuários';
        setErro(mensagemErro);
        toast.error(mensagemErro);
        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [fazerRequisicao]
  );

  /**
   * Buscar usuário por ID
   */
  const buscarUsuario = useCallback(
    async (id: string) => {
      try {
        setCarregando(true);
        setErro(null);

        const dados = await fazerRequisicao(`/api/usuarios/${id}`);
        setUsuario(dados.usuario);

        return dados.usuario;
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao buscar usuário';
        setErro(mensagemErro);
        toast.error(mensagemErro);
        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [fazerRequisicao]
  );

  /**
   * Criar novo usuário
   */
  const criarUsuario = useCallback(
    async (dadosUsuario: CriarUsuarioData) => {
      try {
        setCarregando(true);
        setErro(null);

        const dados = await fazerRequisicao('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(dadosUsuario),
        });

        toast.success(dados.mensagem || 'Usuário criado com sucesso');

        // Atualizar lista local se existir
        if (usuarios.length > 0) {
          setUsuarios(prev => [dados.usuario, ...prev]);
        }

        return dados.usuario;
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao criar usuário';
        setErro(mensagemErro);
        toast.error(mensagemErro);
        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [fazerRequisicao, usuarios]
  );

  /**
   * Atualizar usuário existente
   */
  const atualizarUsuario = useCallback(
    async (id: string, dadosUsuario: AtualizarUsuarioData) => {
      try {
        setCarregando(true);
        setErro(null);

        const dados = await fazerRequisicao(`/api/usuarios/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dadosUsuario),
        });

        toast.success(dados.mensagem || 'Usuário atualizado com sucesso');

        // Atualizar lista local
        setUsuarios(prev => prev.map(u => (u.id === id ? dados.usuario : u)));

        // Atualizar usuário individual se for o mesmo
        if (usuario?.id === id) {
          setUsuario(dados.usuario);
        }

        return dados.usuario;
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao atualizar usuário';
        setErro(mensagemErro);
        toast.error(mensagemErro);
        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [fazerRequisicao, usuario, usuarios]
  );

  /**
   * Desativar usuário (soft delete)
   */
  const desativarUsuario = useCallback(
    async (id: string) => {
      try {
        setCarregando(true);
        setErro(null);

        const dados = await fazerRequisicao(`/api/usuarios/${id}`, {
          method: 'DELETE',
        });

        toast.success(dados.mensagem || 'Usuário desativado com sucesso');

        // Atualizar lista local
        setUsuarios(prev =>
          prev.map(u => (u.id === id ? { ...u, ativo: false } : u))
        );

        // Atualizar usuário individual se for o mesmo
        if (usuario?.id === id) {
          setUsuario(prev => (prev ? { ...prev, ativo: false } : null));
        }

        return dados.usuario;
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao desativar usuário';
        setErro(mensagemErro);
        toast.error(mensagemErro);
        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [fazerRequisicao, usuario, usuarios]
  );

  /**
   * Ativar usuário
   */
  const ativarUsuario = useCallback(
    async (id: string) => {
      try {
        setCarregando(true);
        setErro(null);

        const dados = await fazerRequisicao(`/api/usuarios/${id}/ativar`, {
          method: 'PATCH',
        });

        toast.success(dados.mensagem || 'Usuário ativado com sucesso');

        // Atualizar lista local
        setUsuarios(prev =>
          prev.map(u => (u.id === id ? { ...u, ativo: true } : u))
        );

        // Atualizar usuário individual se for o mesmo
        if (usuario?.id === id) {
          setUsuario(prev => (prev ? { ...prev, ativo: true } : null));
        }

        return dados.usuario;
      } catch (error) {
        const mensagemErro =
          error instanceof Error ? error.message : 'Erro ao ativar usuário';
        setErro(mensagemErro);
        toast.error(mensagemErro);
        throw error;
      } finally {
        setCarregando(false);
      }
    },
    [fazerRequisicao, usuario, usuarios]
  );

  /**
   * Limpar estado
   */
  const limparEstado = useCallback(() => {
    setUsuarios([]);
    setUsuario(null);
    setPaginacao(null);
    setErro(null);
  }, []);

  /**
   * Verificar se o usuário atual pode gerenciar usuários
   */
  const podeGerenciarUsuarios = useCallback(() => {
    return (
      session?.user?.perfil && ['ADMIN', 'GESTOR'].includes(session.user.perfil)
    );
  }, [session]);

  /**
   * Verificar se pode editar usuário específico
   */
  const podeEditarUsuario = useCallback(
    (idUsuario: string) => {
      if (!session?.user) return false;

      // Pode editar próprios dados ou se for admin/gestor
      return (
        session.user.id === idUsuario ||
        ['ADMIN', 'GESTOR'].includes(session.user.perfil)
      );
    },
    [session]
  );

  return {
    // Estado
    usuarios,
    usuario,
    paginacao,
    carregando,
    erro,

    // Ações
    listarUsuarios,
    buscarUsuario,
    criarUsuario,
    atualizarUsuario,
    desativarUsuario,
    ativarUsuario,
    limparEstado,

    // Utilitários
    podeGerenciarUsuarios,
    podeEditarUsuario,
  };
}

export default useUsuarios;
