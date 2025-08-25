'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook personalizado para gerenciar autenticação
 * Fornece informações da sessão e funções de utilidade
 */
export function useAuth() {
  const { data: sessao, status } = useSession();
  const router = useRouter();

  const usuario = sessao?.user;
  const estaCarregando = status === 'loading';
  const estaAutenticado = status === 'authenticated';
  const naoAutenticado = status === 'unauthenticated';

  /**
   * Redireciona para a página de login se não estiver autenticado
   */
  const redirecionarParaLogin = (urlRetorno?: string) => {
    const loginUrl = urlRetorno
      ? `/auth/login?callbackUrl=${encodeURIComponent(urlRetorno)}`
      : '/auth/login';
    router.push(loginUrl);
  };

  /**
   * Redireciona para o dashboard se estiver autenticado
   */
  const redirecionarParaDashboard = () => {
    router.push('/dashboard');
  };

  /**
   * Verifica se o usuário tem uma função específica
   */
  const temPapel = (papel: string) => {
    return usuario?.role === papel;
  };

  /**
   * Verifica se o usuário é administrador
   */
  const ehAdmin = () => {
    return temPapel('ADMIN');
  };

  /**
   * Verifica se o usuário é gerente
   */
  const ehGerente = () => {
    return temPapel('GERENTE');
  };

  /**
   * Verifica se o usuário é atendente
   */
  const ehAtendente = () => {
    return temPapel('ATENDENTE');
  };

  return {
    // Dados da sessão
    sessao,
    usuario,

    // Estados
    estaCarregando,
    estaAutenticado,
    naoAutenticado,

    // Funções de navegação
    redirecionarParaLogin,
    redirecionarParaDashboard,

    // Verificações de papel
    temPapel,
    ehAdmin,
    ehGerente,
    ehAtendente,
  };
}

/**
 * Hook para proteger páginas que requerem autenticação
 * Redireciona automaticamente para login se não estiver autenticado
 */
export function useProtegerPagina() {
  const {
    estaAutenticado,
    naoAutenticado,
    estaCarregando,
    redirecionarParaLogin,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!estaCarregando && naoAutenticado) {
      redirecionarParaLogin(window.location.pathname);
    }
  }, [estaCarregando, naoAutenticado, redirecionarParaLogin]);

  return {
    estaAutenticado,
    estaCarregando,
  };
}

/**
 * Hook para proteger páginas que requerem papéis específicos
 */
export function useProtegerPorPapel(papeisPermitidos: string[]) {
  const { usuario, estaAutenticado, estaCarregando, temPapel } = useAuth();
  const router = useRouter();

  const temPermissao =
    usuario && papeisPermitidos.some(papel => temPapel(papel));

  useEffect(() => {
    if (!estaCarregando && estaAutenticado && !temPermissao) {
      // Redireciona para página de acesso negado ou dashboard
      router.push('/auth/error?error=AccessDenied');
    }
  }, [estaCarregando, estaAutenticado, temPermissao, router]);

  return {
    temPermissao,
    estaCarregando,
    estaAutenticado,
  };
}
