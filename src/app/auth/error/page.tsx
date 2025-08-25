'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const mensagensErro: Record<string, string> = {
  Configuration: 'Erro de configuração do servidor.',
  AccessDenied:
    'Acesso negado. Você não tem permissão para acessar este recurso.',
  Verification: 'Token de verificação inválido ou expirado.',
  Default: 'Ocorreu um erro durante a autenticação.',
  CredentialsSignin: 'Credenciais inválidas. Verifique seu email e senha.',
  SessionRequired: 'Sessão necessária. Faça login para continuar.',
};

export default function PaginaErroAuth() {
  const searchParams = useSearchParams();
  const erro = searchParams.get('error') || 'Default';
  const mensagem = mensagensErro[erro] || mensagensErro.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            Erro de Autenticação
          </CardTitle>
          <CardDescription className="text-center">{mensagem}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>
              Código do erro:{' '}
              <code className="bg-muted px-1 py-0.5 rounded">{erro}</code>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">Ir para Página Inicial</Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
