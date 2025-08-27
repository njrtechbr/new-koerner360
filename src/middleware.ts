import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TipoUsuario } from '@prisma/client';

// Definição de rotas protegidas por tipo de usuário
const ROTAS_POR_TIPO: Record<string, TipoUsuario[]> = {
  '/dashboard': ['ADMIN', 'GESTOR', 'ATENDENTE'],
  '/usuarios': ['ADMIN', 'GESTOR'],
  '/atendentes': ['ADMIN', 'GESTOR'],
  '/relatorios': ['ADMIN', 'GESTOR'],
  '/configuracoes': ['ADMIN'],
  '/feedbacks': ['ADMIN', 'GESTOR', 'ATENDENTE'],
  '/gamificacao': ['ADMIN', 'GESTOR', 'ATENDENTE'],
  // Rotas da API
  '/api/usuarios': ['ADMIN', 'GESTOR', 'ATENDENTE'],
  '/api/atendentes': ['ADMIN', 'GESTOR'],
  '/api/relatorios': ['ADMIN', 'GESTOR'],
};

// Função para verificar se o usuário pode acessar uma rota
function podeAcessarRota(pathname: string, userType: string): boolean {
  // Verifica rotas exatas
  if (ROTAS_POR_TIPO[pathname]) {
    return ROTAS_POR_TIPO[pathname].includes(userType as TipoUsuario);
  }

  // Verifica rotas que começam com um padrão
  for (const [rota, tipos] of Object.entries(ROTAS_POR_TIPO)) {
    if (pathname.startsWith(rota)) {
      return tipos.includes(userType as TipoUsuario);
    }
  }

  return true; // Permite acesso se a rota não está protegida
}

// Função para obter a rota de dashboard baseada no tipo de usuário
function obterDashboardPorTipo(userType: string): string {
  // Todos os tipos de usuário vão para o dashboard principal
  // A diferenciação de acesso é feita pelos componentes internos
  return '/dashboard';
}

// Middleware para proteger rotas que requerem autenticação
export default auth(req => {
  const session = req.auth;
  const isAuth = !!session?.user;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isPublicApiRoute = req.nextUrl.pathname.startsWith('/api/public');
  const userType = session?.user?.userType as string;

  // Permitir acesso às rotas de API de autenticação
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Permitir acesso às rotas de API públicas
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Se o usuário está autenticado e tenta acessar páginas de auth, redireciona para dashboard apropriado
  if (isAuth && isAuthPage) {
    const dashboardUrl = userType
      ? obterDashboardPorTipo(userType)
      : '/dashboard';
    return NextResponse.redirect(new URL(dashboardUrl, req.url));
  }

  // Se o usuário não está autenticado e tenta acessar páginas protegidas, redireciona para login
  if (!isAuth && !isAuthPage && req.nextUrl.pathname !== '/') {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário está autenticado, verifica permissões de acesso
  if (isAuth && !isAuthPage && userType) {
    const podeAcessar = podeAcessarRota(req.nextUrl.pathname, userType);

    if (!podeAcessar) {
      // Redireciona para o dashboard apropriado se não tem permissão
      const dashboardUrl = obterDashboardPorTipo(userType);
      return NextResponse.redirect(new URL(dashboardUrl, req.url));
    }
  }

  return NextResponse.next();
});

// Configuração das rotas que o middleware deve processar
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - arquivos públicos (imagens, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
