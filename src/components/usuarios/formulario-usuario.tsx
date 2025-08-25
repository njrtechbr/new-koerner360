'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  type CriarUsuarioInput,
  type AtualizarUsuarioInput,
} from '@/lib/validations';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/auth';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

interface FormularioUsuarioProps {
  usuario?: Usuario | null;
  onSucesso: () => void;
  onCancelar: () => void;
}

export function FormularioUsuario({
  usuario,
  onSucesso,
  onCancelar,
}: FormularioUsuarioProps) {
  // Permissões são agora gerenciadas pelo PermissionGuard
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [gerarSenhaAutomatica, setGerarSenhaAutomatica] = useState(false);

  const isEdicao = !!usuario;
  const schema = isEdicao ? atualizarUsuarioSchema : criarUsuarioSchema;

  const form = useForm<CriarUsuarioInput | AtualizarUsuarioInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: usuario?.nome || '',
      email: usuario?.email || '',
      perfil: usuario?.perfil || 'OPERADOR',
      ativo: usuario?.ativo ?? true,
      ...(isEdicao ? {} : { senha: '', confirmarSenha: '' }),
    },
  });

  // Gerar senha automática
  const gerarSenhaAleatoria = () => {
    const caracteres =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let senha = '';

    // Garantir pelo menos um de cada tipo
    senha += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    senha += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    senha += '0123456789'[Math.floor(Math.random() * 10)];
    senha += '@#$%&*'[Math.floor(Math.random() * 6)];

    // Completar com caracteres aleatórios
    for (let i = 4; i < 12; i++) {
      senha += caracteres[Math.floor(Math.random() * caracteres.length)];
    }

    // Embaralhar a senha
    return senha
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  // Aplicar senha gerada automaticamente
  useEffect(() => {
    if (gerarSenhaAutomatica && !isEdicao) {
      const senhaGerada = gerarSenhaAleatoria();
      form.setValue('senha', senhaGerada);
      form.setValue('confirmarSenha', senhaGerada);
    }
  }, [gerarSenhaAutomatica, isEdicao, form]);

  // Submeter formulário
  const onSubmit = async (data: CriarUsuarioInput | AtualizarUsuarioInput) => {
    try {
      setCarregando(true);

      const url = isEdicao ? `/api/usuarios/${usuario.id}` : '/api/usuarios';
      const method = isEdicao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.erro ||
            `Erro ao ${isEdicao ? 'atualizar' : 'criar'} usuário`
        );
      }

      const resultado = await response.json();

      toast.success(
        isEdicao
          ? 'Usuário atualizado com sucesso'
          : `Usuário criado com sucesso${gerarSenhaAutomatica ? '. Senha: ' + data.senha : ''}`
      );

      onSucesso();
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro inesperado');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados pessoais e de identificação do usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome completo"
                      {...field}
                      disabled={carregando}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@exemplo.com"
                      {...field}
                      disabled={carregando}
                    />
                  </FormControl>
                  <FormDescription>
                    O email será usado para login e comunicações do sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Senha (apenas para criação) */}
        {!isEdicao && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Senha</CardTitle>
              <CardDescription>
                Defina a senha inicial do usuário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="gerar-senha"
                  checked={gerarSenhaAutomatica}
                  onCheckedChange={setGerarSenhaAutomatica}
                  disabled={carregando}
                />
                <Label htmlFor="gerar-senha">Gerar senha automaticamente</Label>
              </div>

              {!gerarSenhaAutomatica && (
                <>
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={mostrarSenha ? 'text' : 'password'}
                              placeholder="Digite a senha"
                              {...field}
                              disabled={carregando}
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
                        </FormControl>
                        <FormDescription>
                          Mínimo 8 caracteres com letras maiúsculas, minúsculas,
                          números e símbolos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={mostrarConfirmarSenha ? 'text' : 'password'}
                              placeholder="Confirme a senha"
                              {...field}
                              disabled={carregando}
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {gerarSenhaAutomatica && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Uma senha segura será gerada automaticamente. A senha será
                    exibida após a criação do usuário.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Permissões e configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões e Configurações</CardTitle>
            <CardDescription>
              Configure o perfil de acesso e status do usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PermissionGuard requiredPermissions={['gerenciar_usuarios']}>
              <FormField
                control={form.control}
                name="perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil de Acesso</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={carregando}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPERADOR">Operador</SelectItem>
                        <SelectItem value="GESTOR">Gestor</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define as permissões e funcionalidades disponíveis para o
                      usuário
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </PermissionGuard>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuário Ativo</FormLabel>
                    <FormDescription>
                      Usuários inativos não podem fazer login no sistema
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={carregando}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={carregando}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={carregando || (!podeEditarUsuarios && isEdicao)}
            className="flex-1 sm:flex-none"
          >
            {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdicao ? 'Atualizar Usuário' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
