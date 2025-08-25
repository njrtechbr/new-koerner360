'use client';

import { useSession } from 'next-auth/react';
import { TipoUsuario } from '@/generated/prisma';

// Definição de permissões por tipo de usuário
const PERMISSOES_POR_TIPO: Record<TipoUsuario, string[]> = {
  ADMIN: [
    // Usuários
    'gerenciar_usuarios',
    'criar_usuarios',
    'editar_usuarios',
    'excluir_usuarios',
    'ativar_usuarios',
    'desativar_usuarios',
    'redefinir_senha_usuarios',
    'visualizar_usuarios',
    'importar_usuarios',
    'exportar_usuarios',

    // Atendentes
    'gerenciar_atendentes',

    // Sistema
    'visualizar_relatorios',
    'gerenciar_sistema',
    'visualizar_dashboard_admin',
    'gerenciar_feedbacks',
    'gerenciar_avaliacoes',
    'gerenciar_gamificacao',
  ],
  GESTOR: [
    // Usuários (limitado)
    'visualizar_usuarios',
    'criar_usuarios',
    'editar_usuarios',
    'ativar_usuarios',
    'desativar_usuarios',
    'exportar_usuarios',

    // Atendentes
    'gerenciar_atendentes',

    // Sistema
    'visualizar_relatorios',
    'visualizar_dashboard_gestor',
    'gerenciar_feedbacks',
    'gerenciar_avaliacoes',
    'visualizar_gamificacao',
  ],
  ATENDENTE: [
    // Usuários (apenas visualização)
    'visualizar_usuarios',

    // Sistema
    'visualizar_dashboard_atendente',
    'criar_feedbacks',
    'visualizar_avaliacoes_proprias',
    'visualizar_gamificacao_propria',
  ],
};

// Definição de rotas protegidas por permissão
const ROTAS_PROTEGIDAS: Record<string, string[]> = {
  '/dashboard/admin': ['visualizar_dashboard_admin'],
  '/dashboard/gestor': ['visualizar_dashboard_gestor'],
  '/dashboard/atendente': ['visualizar_dashboard_atendente'],
  '/usuarios': ['gerenciar_usuarios'],
  '/atendentes': ['gerenciar_atendentes'],
  '/relatorios': ['visualizar_relatorios'],
  '/sistema': ['gerenciar_sistema'],
  '/feedbacks': ['gerenciar_feedbacks', 'criar_feedbacks'],
  '/avaliacoes': ['gerenciar_avaliacoes', 'visualizar_avaliacoes_proprias'],
  '/gamificacao': ['gerenciar_gamificacao', 'visualizar_gamificacao_propria'],
};

export function usePermissions() {
  const { data: session, status } = useSession();

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const temPermissao = (permissao: string): boolean => {
    if (status === 'loading' || !session?.user?.userType) {
      return false;
    }

    const tipoUsuario = session.user.userType as TipoUsuario;
    const permissoesUsuario = PERMISSOES_POR_TIPO[tipoUsuario] || [];

    return permissoesUsuario.includes(permissao);
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões fornecidas
   */
  const temAlgumaPermissao = (permissoes: string[]): boolean => {
    return permissoes.some(permissao => temPermissao(permissao));
  };

  /**
   * Verifica se o usuário tem todas as permissões fornecidas
   */
  const temTodasPermissoes = (permissoes: string[]): boolean => {
    return permissoes.every(permissao => temPermissao(permissao));
  };

  /**
   * Verifica se o usuário pode acessar uma rota específica
   */
  const podeAcessarRota = (rota: string): boolean => {
    const permissoesNecessarias = ROTAS_PROTEGIDAS[rota];

    if (!permissoesNecessarias) {
      return true; // Rota não protegida
    }

    return temAlgumaPermissao(permissoesNecessarias);
  };

  /**
   * Verifica se o usuário é de um tipo específico
   */
  const ehTipoUsuario = (tipo: TipoUsuario): boolean => {
    if (status === 'loading' || !session?.user?.userType) {
      return false;
    }

    return session.user.userType === tipo;
  };

  /**
   * Verifica se o usuário é administrador
   */
  const ehAdmin = (): boolean => ehTipoUsuario('ADMIN');

  /**
   * Verifica se o usuário é gestor
   */
  const ehGestor = (): boolean => ehTipoUsuario('GESTOR');

  /**
   * Verifica se o usuário é atendente
   */
  const ehAtendente = (): boolean => ehTipoUsuario('ATENDENTE');

  /**
   * Obtém todas as permissões do usuário atual
   */
  const obterPermissoes = (): string[] => {
    if (status === 'loading' || !session?.user?.userType) {
      return [];
    }

    const tipoUsuario = session.user.userType as TipoUsuario;
    return PERMISSOES_POR_TIPO[tipoUsuario] || [];
  };

  /**
   * Obtém o tipo de usuário atual
   */
  const obterTipoUsuario = (): TipoUsuario | null => {
    if (status === 'loading' || !session?.user?.userType) {
      return null;
    }

    return session.user.userType as TipoUsuario;
  };

  // Permissões específicas para usuários
  const podeGerenciarUsuarios = (): boolean =>
    temPermissao('gerenciar_usuarios');
  const podeCriarUsuarios = (): boolean => temPermissao('criar_usuarios');
  const podeEditarUsuarios = (): boolean => temPermissao('editar_usuarios');
  const podeExcluirUsuarios = (): boolean => temPermissao('excluir_usuarios');
  const podeAtivarUsuarios = (): boolean => temPermissao('ativar_usuarios');
  const podeDesativarUsuarios = (): boolean =>
    temPermissao('desativar_usuarios');
  const podeRedefinirSenhaUsuarios = (): boolean =>
    temPermissao('redefinir_senha_usuarios');
  const podeVisualizarUsuarios = (): boolean =>
    temPermissao('visualizar_usuarios');
  const podeImportarUsuarios = (): boolean => temPermissao('importar_usuarios');
  const podeExportarUsuarios = (): boolean => temPermissao('exportar_usuarios');

  return {
    // Verificações de permissão
    temPermissao,
    temAlgumaPermissao,
    temTodasPermissoes,
    podeAcessarRota,

    // Verificações de tipo de usuário
    ehTipoUsuario,
    ehAdmin,
    ehGestor,
    ehAtendente,

    // Permissões específicas de usuários
    podeGerenciarUsuarios,
    podeCriarUsuarios,
    podeEditarUsuarios,
    podeExcluirUsuarios,
    podeAtivarUsuarios,
    podeDesativarUsuarios,
    podeRedefinirSenhaUsuarios,
    podeVisualizarUsuarios,
    podeImportarUsuarios,
    podeExportarUsuarios,

    // Utilitários
    obterPermissoes,
    obterTipoUsuario,

    // Estado da sessão
    carregando: status === 'loading',
    autenticado: status === 'authenticated',
    usuario: session?.user,
  };
}

// Hook para proteger componentes baseado em permissões
export function useProtegerPorPermissao(permissoes: string[]) {
  const { temAlgumaPermissao, carregando } = usePermissions();

  return {
    podeAcessar: temAlgumaPermissao(permissoes),
    carregando,
  };
}

// Hook para proteger componentes baseado em tipo de usuário
export function useProtegerPorTipo(tipos: TipoUsuario[]) {
  const { obterTipoUsuario, carregando } = usePermissions();
  const tipoAtual = obterTipoUsuario();

  return {
    podeAcessar: tipoAtual ? tipos.includes(tipoAtual) : false,
    carregando,
  };
}
