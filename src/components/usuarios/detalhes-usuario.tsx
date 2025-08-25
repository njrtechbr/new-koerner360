'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { formatarData } from '@/lib/utils';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  ultimoLogin?: string;
  avatar?: string;
}

interface DetalhesUsuarioProps {
  usuarioId: string;
  onEditar: (usuario: Usuario) => void;
  onExcluir: (usuarioId: string) => void;
  onAlterarStatus: (usuarioId: string, ativo: boolean) => void;
  onRedefinirSenha: (usuarioId: string) => void;
  onFechar: () => void;
}

export function DetalhesUsuario({
  usuarioId,
  onEditar,
  onExcluir,
  onAlterarStatus,
  onRedefinirSenha,
  onFechar,
}: DetalhesUsuarioProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { podeGerenciarUsuarios, podeExcluirUsuarios } = usePermissions();

  // Carregar dados do usuário
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        setCarregando(true);
        setErro(null);

        const response = await fetch(`/api/usuarios/${usuarioId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.erro || 'Erro ao carregar usuário');
        }

        const dadosUsuario = await response.json();
        setUsuario(dadosUsuario);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setErro(error instanceof Error ? error.message : 'Erro inesperado');
        toast.error('Erro ao carregar dados do usuário');
      } finally {
        setCarregando(false);
      }
    };

    if (usuarioId) {
      carregarUsuario();
    }
  }, [usuarioId]);

  // Obter iniciais do nome
  const obterIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Obter cor do badge do perfil
  const obterCorPerfil = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN':
        return 'destructive';
      case 'GESTOR':
        return 'default';
      case 'OPERADOR':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Manipular alteração de status
  const manipularAlteracaoStatus = async () => {
    if (!usuario) return;

    try {
      const novoStatus = !usuario.ativo;
      await onAlterarStatus(usuario.id, novoStatus);

      setUsuario(prev => (prev ? { ...prev, ativo: novoStatus } : null));

      toast.success(
        novoStatus
          ? 'Usuário ativado com sucesso'
          : 'Usuário desativado com sucesso'
      );
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  // Manipular redefinição de senha
  const manipularRedefinicaoSenha = async () => {
    if (!usuario) return;

    try {
      await onRedefinirSenha(usuario.id);
      toast.success('Senha redefinida com sucesso');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha');
    }
  };

  // Manipular exclusão
  const manipularExclusao = async () => {
    if (!usuario) return;

    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o usuário "${usuario.nome}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (confirmacao) {
      try {
        await onExcluir(usuario.id);
        toast.success('Usuário excluído com sucesso');
        onFechar();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        toast.error('Erro ao excluir usuário');
      }
    }
  };

  // Renderizar estado de carregamento
  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados do usuário...</span>
        </div>
      </div>
    );
  }

  // Renderizar estado de erro
  if (erro || !usuario) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar usuário</h3>
          <p className="text-muted-foreground">
            {erro || 'Usuário não encontrado'}
          </p>
        </div>
        <Button onClick={onFechar} variant="outline">
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com avatar e informações básicas */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={usuario.avatar} alt={usuario.nome} />
              <AvatarFallback className="text-lg">
                {obterIniciais(usuario.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{usuario.nome}</h2>
                <Badge
                  variant={usuario.ativo ? 'default' : 'secondary'}
                  className={usuario.ativo ? 'bg-green-500' : 'bg-gray-500'}
                >
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{usuario.email}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <Badge variant={obterCorPerfil(usuario.perfil)}>
                    {usuario.perfil}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Data de Criação
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatarData(usuario.criadoEm)}</span>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Última Atualização
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatarData(usuario.atualizadoEm)}</span>
              </div>
            </div>

            {usuario.ultimoLogin && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Último Login
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{formatarData(usuario.ultimoLogin)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ações disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Disponíveis</CardTitle>
            <CardDescription>
              Operações que podem ser realizadas com este usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {podeGerenciarUsuarios && (
              <Button
                onClick={() => onEditar(usuario)}
                variant="outline"
                className="w-full justify-start"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Usuário
              </Button>
            )}

            {podeGerenciarUsuarios && (
              <Button
                onClick={manipularAlteracaoStatus}
                variant="outline"
                className="w-full justify-start"
              >
                {usuario.ativo ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar Usuário
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar Usuário
                  </>
                )}
              </Button>
            )}

            {podeGerenciarUsuarios && (
              <Button
                onClick={manipularRedefinicaoSenha}
                variant="outline"
                className="w-full justify-start"
              >
                <Key className="mr-2 h-4 w-4" />
                Redefinir Senha
              </Button>
            )}

            {podeExcluirUsuarios && (
              <Button
                onClick={manipularExclusao}
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Usuário
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botão de fechar */}
      <div className="flex justify-end pt-6">
        <Button onClick={onFechar} variant="outline">
          Fechar
        </Button>
      </div>
    </div>
  );
}

// Componente Label para consistência
function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}
