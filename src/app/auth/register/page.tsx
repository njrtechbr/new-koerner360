'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TipoUsuario } from '@/lib/types';

export default function PaginaRegistro() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    userType: '' as TipoUsuario | '',
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleInputChange = (campo: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return false;
    }

    if (!formData.senha) {
      toast.error('Senha é obrigatória');
      return false;
    }

    if (formData.senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('Senhas não coincidem');
      return false;
    }

    if (!formData.userType) {
      toast.error('Tipo de usuário é obrigatório');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
          senha: formData.senha,
          userType: formData.userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      toast.success('Conta criada com sucesso! Faça login para continuar.');
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro interno do servidor'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestão de Atendimento Koerner360
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={formData.nome}
                onChange={e => handleInputChange('nome', e.target.value)}
                required
                disabled={carregando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                required
                disabled={carregando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">Tipo de Usuário</Label>
              <Select
                value={formData.userType}
                onValueChange={value => handleInputChange('userType', value)}
                disabled={carregando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="GESTOR">Gestor</SelectItem>
                  <SelectItem value="ATENDENTE">Atendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Sua senha (mín. 6 caracteres)"
                  value={formData.senha}
                  onChange={e => handleInputChange('senha', e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={formData.confirmarSenha}
                  onChange={e =>
                    handleInputChange('confirmarSenha', e.target.value)
                  }
                  required
                  disabled={carregando}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                  }
                  disabled={carregando}
                >
                  {mostrarConfirmarSenha ? (
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
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
