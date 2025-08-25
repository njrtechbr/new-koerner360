'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: ReactNode;
  permissoes?: string[];
  tipos?: ('ADMIN' | 'GESTOR' | 'ATENDENTE')[];
  rota?: string;
  redirecionarPara?: string;
  mostrarCarregamento?: boolean;
  mostrarErro?: boolean;
}

/**
 * Componente para proteger rotas e componentes baseado em permissões
 */
export function AuthGuard({
  children,
  permissoes = [],
  tipos = [],
  rota,
  redirecionarPara = '/dashboard',
  mostrarCarregamento = true,
  mostrarErro = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { status } = useSession();
  const {
    temAlgumaPermissao,
    temTodasPermissoes,
    ehTipoUsuario,
    podeAcessarRota,
    carregando,
    autenticado,
  } = usePermissions();

  useEffect(() => {
    // Aguardar carregamento da sessão
    if (carregando) return;

    // Verificar se está autenticado
    if (!autenticado) {
      if (mostrarErro) {
        toast.error('Você precisa estar logado para acessar esta página');
      }
      router.push('/auth/login');
      return;
    }

    // Verificar permissões por rota
    if (rota && !podeAcessarRota(rota)) {
      if (mostrarErro) {
        toast.error('Você não tem permissão para acessar esta página');
      }
      router.push(redirecionarPara);
      return;
    }

    // Verificar permissões específicas
    if (permissoes.length > 0 && !temAlgumaPermissao(permissoes)) {
      if (mostrarErro) {
        toast.error('Você não tem permissão para acessar esta funcionalidade');
      }
      router.push(redirecionarPara);
      return;
    }

    // Verificar tipos de usuário
    if (tipos.length > 0 && !tipos.some(tipo => ehTipoUsuario(tipo))) {
      if (mostrarErro) {
        toast.error('Seu perfil não tem acesso a esta funcionalidade');
      }
      router.push(redirecionarPara);
      return;
    }
  }, [
    carregando,
    autenticado,
    permissoes,
    tipos,
    rota,
    router,
    redirecionarPara,
    mostrarErro,
  ]);

  // Mostrar carregamento
  if (carregando && mostrarCarregamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  // Não mostrar conteúdo se não estiver autenticado ou sem permissão
  if (!autenticado) {
    return null;
  }

  // Verificar permissões antes de renderizar
  if (rota && !podeAcessarRota(rota)) {
    return null;
  }

  if (permissoes.length > 0 && !temAlgumaPermissao(permissoes)) {
    return null;
  }

  if (tipos.length > 0 && !tipos.some(tipo => ehTipoUsuario(tipo))) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário pode acessar determinada funcionalidade
 */
export function useAuthGuard({
  permissoes = [],
  tipos = [],
  rota,
}: Omit<
  AuthGuardProps,
  'children' | 'redirecionarPara' | 'mostrarCarregamento' | 'mostrarErro'
>) {
  const {
    temAlgumaPermissao,
    ehTipoUsuario,
    podeAcessarRota,
    carregando,
    autenticado,
  } = usePermissions();

  const podeAcessar = () => {
    if (!autenticado) return false;

    if (rota && !podeAcessarRota(rota)) return false;

    if (permissoes.length > 0 && !temAlgumaPermissao(permissoes)) return false;

    if (tipos.length > 0 && !tipos.some(tipo => ehTipoUsuario(tipo)))
      return false;

    return true;
  };

  return {
    podeAcessar: podeAcessar(),
    carregando,
    autenticado,
  };
}

/**
 * Componente para mostrar/esconder elementos baseado em permissões
 */
export function PermissionGuard({
  children,
  permissoes = [],
  tipos = [],
  rota,
  fallback = null,
}: AuthGuardProps & { fallback?: ReactNode }) {
  const { podeAcessar } = useAuthGuard({ permissoes, tipos, rota });

  if (!podeAcessar) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
