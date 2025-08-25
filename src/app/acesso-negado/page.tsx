'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

/**
 * Página de Acesso Negado
 * Exibida quando o usuário tenta acessar uma rota sem permissão
 */
export default function AcessoNegadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [rotaTentativa, setRotaTentativa] = useState<string>('');

  useEffect(() => {
    const rota = searchParams.get('rota');
    if (rota) {
      setRotaTentativa(rota);
    }
  }, [searchParams]);

  const voltarPagina = () => {
    router.back();
  };

  const irParaDashboard = () => {
    // Redirecionar para o dashboard apropriado baseado no tipo de usuário
    if (session?.user?.userType === 'ADMIN') {
      router.push('/dashboard/admin');
    } else if (session?.user?.userType === 'GESTOR') {
      router.push('/dashboard/gestor');
    } else if (session?.user?.userType === 'ATENDENTE') {
      router.push('/dashboard/atendente');
    } else {
      router.push('/dashboard');
    }
  };

  const obterMensagemPermissao = () => {
    const tipoUsuario = session?.user?.userType;

    switch (tipoUsuario) {
      case 'ATENDENTE':
        return 'Como atendente, você tem acesso limitado a certas funcionalidades do sistema.';
      case 'GESTOR':
        return 'Como gestor, você não tem permissão para acessar esta área administrativa.';
      case 'ADMIN':
        return 'Ocorreu um erro inesperado. Como administrador, você deveria ter acesso a esta área.';
      default:
        return 'Seu perfil de usuário não possui permissão para acessar esta área.';
    }
  };

  const obterSugestoes = () => {
    const tipoUsuario = session?.user?.userType;

    const sugestoes = {
      ATENDENTE: [
        'Acesse o dashboard de atendimento',
        'Visualize seus feedbacks e avaliações',
        'Consulte sua pontuação na gamificação',
      ],
      GESTOR: [
        'Acesse o dashboard de gestão',
        'Gerencie atendentes da sua equipe',
        'Visualize relatórios de performance',
      ],
      ADMIN: [
        'Acesse o dashboard administrativo',
        'Gerencie usuários e permissões',
        'Configure o sistema',
      ],
    };

    return (
      sugestoes[tipoUsuario as keyof typeof sugestoes] || [
        'Entre em contato com o administrador',
        'Verifique suas permissões de acesso',
      ]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acesso Negado
          </CardTitle>
          <CardDescription className="text-gray-600">
            Você não tem permissão para acessar esta área
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {rotaTentativa && (
            <Alert>
              <AlertDescription>
                <strong>Rota solicitada:</strong> {rotaTentativa}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p>{obterMensagemPermissao()}</p>
          </div>

          {session?.user && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Informações da sua conta:
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Nome:</strong> {session.user.name}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
                <p>
                  <strong>Perfil:</strong> {session.user.userType}
                </p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              O que você pode fazer:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {obterSugestoes().map((sugestao, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {sugestao}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={voltarPagina} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <Button onClick={irParaDashboard} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Se você acredita que deveria ter acesso a esta área,
              <br />
              entre em contato com o administrador do sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
