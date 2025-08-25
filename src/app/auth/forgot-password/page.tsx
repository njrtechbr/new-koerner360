'use client';

import { useState } from 'react';
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
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaginaRecuperacaoSenha() {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Por favor, insira seu email');
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailEnviado(true);
        toast.success('Email de recuperação enviado com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao enviar email de recuperação');
      }
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setCarregando(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Email Enviado</CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada e siga as instruções para redefinir
              sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Não recebeu o email? Verifique sua pasta de spam ou tente
                novamente em alguns minutos.
              </div>

              <Button
                onClick={() => {
                  setEmailEnviado(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Tentar novamente
              </Button>

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
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber as instruções de recuperação de senha.
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

            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Email de Recuperação'
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
