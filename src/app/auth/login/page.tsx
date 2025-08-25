'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaginaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const resultado = await signIn('credentials', {
        email,
        senha,
        redirect: false,
      });

      if (resultado?.error) {
        toast.error('Credenciais inválidas. Verifique seu email e senha.');
      } else {
        toast.success('Login realizado com sucesso!');

        // Aguarda a sessão ser atualizada
        const sessao = await getSession();
        if (sessao) {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro interno do servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Koerner360
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestão de Atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={carregando}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  disabled={carregando}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  disabled={carregando}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={carregando || !email || !senha}
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Credenciais de Desenvolvimento */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Credenciais de Desenvolvimento
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Administrador:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setEmail('admin@koerner360.com');
                    setSenha('admin123');
                  }}
                >
                  Usar
                </Button>
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                admin@koerner360.com / admin123
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Gestor:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setEmail('gestor@koerner360.com');
                    setSenha('gestor123');
                  }}
                >
                  Usar
                </Button>
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                gestor@koerner360.com / gestor123
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Atendente:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setEmail('atendente@koerner360.com');
                    setSenha('atendente123');
                  }}
                >
                  Usar
                </Button>
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                atendente@koerner360.com / atendente123
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              <Link
                href="/auth/forgot-password"
                className="text-primary hover:underline font-medium"
              >
                Esqueceu sua senha?
              </Link>
            </div>
            <div>
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Link
                href="/auth/register"
                className="text-primary hover:underline font-medium"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
