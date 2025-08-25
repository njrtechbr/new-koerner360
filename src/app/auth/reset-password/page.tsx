'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaginaRedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      return;
    }

    // Verificar se o token é válido
    const verificarToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        setTokenValido(response.ok);
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        setTokenValido(false);
      }
    };

    verificarToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaSenha || !confirmarSenha) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Senha redefinida com sucesso!');
        router.push('/auth/login');
      } else {
        toast.error(data.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Erro na redefinição de senha:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setCarregando(false);
    }
  };

  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Verificando token...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">
              Token Inválido
            </CardTitle>
            <CardDescription>
              O link de recuperação é inválido ou expirou. Solicite um novo link
              de recuperação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/auth/forgot-password">
                <Button className="w-full">Solicitar Nova Recuperação</Button>
              </Link>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua nova senha"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  required
                  disabled={carregando}
                  minLength={6}
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

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={mostrarConfirmacao ? 'text' : 'password'}
                  placeholder="Confirme sua nova senha"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  required
                  disabled={carregando}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                  disabled={carregando}
                >
                  {mostrarConfirmacao ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
