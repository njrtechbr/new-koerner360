import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * Função para obter a sessão do servidor no NextAuth v5
 * Substitui o getServerSession do NextAuth v4
 */
export async function getServerSession() {
  return await auth();
}

/**
 * Função para verificar se o usuário está autenticado
 */
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session?.user;
}

/**
 * Função para obter o usuário da sessão
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}
