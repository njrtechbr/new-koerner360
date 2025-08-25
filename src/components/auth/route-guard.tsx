'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/use-permissions';
import { TipoUsuario } from '@/generated/prisma';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  permissoesNecessarias?: string[];
  tiposPermitidos?: TipoUsuario[];
  rotaRedirecionamento?: string;
  mostrarCarregamento?: boolean;
  mostrarAcessoNegado?: boolean;
}

// Componente de carregamento padrão
function ComponenteCarregamento() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Verificando permissões...</span>
      </div>
    </div>
  );
}

// Componente de acesso negado padrão
function ComponenteAcessoNegado() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
        <button
          onClick={() => window.history.back()}
          className="text-primary hover:underline"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

export function RouteGuard({
  children,
  permissoesNecessarias = [],
  tiposPermitidos = [],
  rotaRedirecionamento,
  mostrarCarregamento = true,
  mostrarAcessoNegado = true,
}: RouteGuardProps) {
  const { status } = useSession();
  const router = useRouter();
  const {
    temAlgumaPermissao,
    ehTipoUsuario,
    carregando,
    autenticado,
    obterTipoUsuario,
  } = usePermissions();

  useEffect(() => {
    // Se não está autenticado, redireciona para login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Se está carregando, aguarda
    if (carregando || status === 'loading') {
      return;
    }

    // Se está autenticado, verifica permissões
    if (autenticado) {
      let temAcesso = true;

      // Verifica permissões específicas
      if (permissoesNecessarias.length > 0) {
        temAcesso = temAlgumaPermissao(permissoesNecessarias);
      }

      // Verifica tipos de usuário permitidos
      if (tiposPermitidos.length > 0 && temAcesso) {
        const tipoAtual = obterTipoUsuario();
        temAcesso = tipoAtual ? tiposPermitidos.includes(tipoAtual) : false;
      }

      // Se não tem acesso e há rota de redirecionamento, redireciona
      if (!temAcesso && rotaRedirecionamento) {
        router.push(rotaRedirecionamento);
        return;
      }
    }
  }, [
    status,
    carregando,
    autenticado,
    permissoesNecessarias,
    tiposPermitidos,
    rotaRedirecionamento,
    router,
    temAlgumaPermissao,
    obterTipoUsuario,
  ]);

  // Mostra carregamento enquanto verifica autenticação e permissões
  if (status === 'loading' || carregando) {
    return mostrarCarregamento ? <ComponenteCarregamento /> : null;
  }

  // Se não está autenticado, não mostra nada (será redirecionado)
  if (status === 'unauthenticated') {
    return null;
  }

  // Verifica permissões
  let temAcesso = true;

  if (permissoesNecessarias.length > 0) {
    temAcesso = temAlgumaPermissao(permissoesNecessarias);
  }

  if (tiposPermitidos.length > 0 && temAcesso) {
    const tipoAtual = obterTipoUsuario();
    temAcesso = tipoAtual ? tiposPermitidos.includes(tipoAtual) : false;
  }

  // Se não tem acesso e não há rota de redirecionamento, mostra componente de acesso negado
  if (!temAcesso && !rotaRedirecionamento) {
    return mostrarAcessoNegado ? <ComponenteAcessoNegado /> : null;
  }

  // Se não tem acesso mas há rota de redirecionamento, não mostra nada (será redirecionado)
  if (!temAcesso && rotaRedirecionamento) {
    return null;
  }

  // Se tem acesso, renderiza os filhos
  return <>{children}</>;
}

// Hook para usar o RouteGuard de forma mais simples
export function useRouteGuard({
  permissoesNecessarias = [],
  tiposPermitidos = [],
}: {
  permissoesNecessarias?: string[];
  tiposPermitidos?: TipoUsuario[];
}) {
  const { temAlgumaPermissao, obterTipoUsuario, carregando, autenticado } =
    usePermissions();

  let temAcesso = autenticado;

  if (permissoesNecessarias.length > 0 && temAcesso) {
    temAcesso = temAlgumaPermissao(permissoesNecessarias);
  }

  if (tiposPermitidos.length > 0 && temAcesso) {
    const tipoAtual = obterTipoUsuario();
    temAcesso = tipoAtual ? tiposPermitidos.includes(tipoAtual) : false;
  }

  return {
    temAcesso,
    carregando,
    autenticado,
  };
}
