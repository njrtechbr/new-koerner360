// Exportações dos componentes de autenticação e autorização
export { AuthGuard, PermissionGuard, useAuthGuard } from './auth-guard';

// Tipos relacionados à autenticação
export interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredUserTypes?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredUserTypes?: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}
