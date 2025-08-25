import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Configuração do NextAuth.js v5 para autenticação
const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Exporta os métodos HTTP para o App Router
export const { GET, POST } = handlers;
export { auth, signIn, signOut };
