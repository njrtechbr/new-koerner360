'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trophy,
  Star,
  Target,
  Award,
  TrendingUp,
  Users,
  Crown,
  Medal,
  Zap,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

interface Atendente {
  id: string;
  nome: string;
  avatar?: string;
  pontuacao: number;
  nivel: number;
  experiencia: number;
  experienciaProximoNivel: number;
  posicaoRanking: number;
  conquistas: string[];
  metasAtingidas: number;
  totalMetas: number;
}

interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: 'atendimento' | 'avaliacao' | 'feedback' | 'especial';
  pontos: number;
  requisito: string;
  desbloqueada: boolean;
  dataDesbloqueio?: string;
}

interface Meta {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'diaria' | 'semanal' | 'mensal';
  progresso: number;
  objetivo: number;
  recompensa: number;
  status: 'ativa' | 'concluida' | 'expirada';
  dataLimite: string;
}

const mockAtendentes: Atendente[] = [
  {
    id: '1',
    nome: 'João Silva',
    avatar: '/avatars/joao.jpg',
    pontuacao: 2450,
    nivel: 8,
    experiencia: 750,
    experienciaProximoNivel: 1000,
    posicaoRanking: 1,
    conquistas: [
      'primeira-avaliacao-5',
      'atendimento-rapido',
      'feedback-positivo',
    ],
    metasAtingidas: 8,
    totalMetas: 10,
  },
  {
    id: '2',
    nome: 'Ana Costa',
    avatar: '/avatars/ana.jpg',
    pontuacao: 2180,
    nivel: 7,
    experiencia: 480,
    experienciaProximoNivel: 800,
    posicaoRanking: 2,
    conquistas: ['feedback-positivo', 'meta-semanal'],
    metasAtingidas: 7,
    totalMetas: 10,
  },
  {
    id: '3',
    nome: 'Pedro Santos',
    avatar: '/avatars/pedro.jpg',
    pontuacao: 1950,
    nivel: 6,
    experiencia: 320,
    experienciaProximoNivel: 600,
    posicaoRanking: 3,
    conquistas: ['primeira-avaliacao-5'],
    metasAtingidas: 5,
    totalMetas: 10,
  },
];

const mockConquistas: Conquista[] = [
  {
    id: 'primeira-avaliacao-5',
    nome: 'Primeira Estrela',
    descricao: 'Receba sua primeira avaliação 5 estrelas',
    icone: '⭐',
    categoria: 'avaliacao',
    pontos: 100,
    requisito: '1 avaliação 5 estrelas',
    desbloqueada: true,
    dataDesbloqueio: '2024-01-15',
  },
  {
    id: 'atendimento-rapido',
    nome: 'Velocidade da Luz',
    descricao: 'Complete 10 atendimentos em menos de 5 minutos',
    icone: '⚡',
    categoria: 'atendimento',
    pontos: 200,
    requisito: '10 atendimentos < 5min',
    desbloqueada: true,
    dataDesbloqueio: '2024-01-20',
  },
  {
    id: 'feedback-positivo',
    nome: 'Querido pelos Clientes',
    descricao: 'Receba 50 feedbacks positivos',
    icone: '💝',
    categoria: 'feedback',
    pontos: 300,
    requisito: '50 feedbacks positivos',
    desbloqueada: true,
    dataDesbloqueio: '2024-01-25',
  },
  {
    id: 'meta-semanal',
    nome: 'Consistência',
    descricao: 'Complete todas as metas semanais por 4 semanas consecutivas',
    icone: '🎯',
    categoria: 'especial',
    pontos: 500,
    requisito: '4 semanas consecutivas',
    desbloqueada: false,
  },
  {
    id: 'avaliacao-perfeita',
    nome: 'Perfeição',
    descricao: 'Mantenha média 5.0 por um mês inteiro',
    icone: '👑',
    categoria: 'avaliacao',
    pontos: 1000,
    requisito: 'Média 5.0 por 1 mês',
    desbloqueada: false,
  },
];

const mockMetas: Meta[] = [
  {
    id: '1',
    titulo: 'Atendimentos Diários',
    descricao: 'Complete 15 atendimentos hoje',
    tipo: 'diaria',
    progresso: 12,
    objetivo: 15,
    recompensa: 50,
    status: 'ativa',
    dataLimite: '2024-01-30T23:59:59Z',
  },
  {
    id: '2',
    titulo: 'Avaliação Semanal',
    descricao: 'Mantenha média acima de 4.5 esta semana',
    tipo: 'semanal',
    progresso: 4.7,
    objetivo: 4.5,
    recompensa: 200,
    status: 'concluida',
    dataLimite: '2024-02-04T23:59:59Z',
  },
  {
    id: '3',
    titulo: 'Feedbacks Mensais',
    descricao: 'Receba 20 feedbacks positivos este mês',
    tipo: 'mensal',
    progresso: 15,
    objetivo: 20,
    recompensa: 500,
    status: 'ativa',
    dataLimite: '2024-01-31T23:59:59Z',
  },
];

const nivelColors = {
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-gray-100 text-gray-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-blue-100 text-blue-800',
  6: 'bg-blue-100 text-blue-800',
  7: 'bg-purple-100 text-purple-800',
  8: 'bg-purple-100 text-purple-800',
  9: 'bg-yellow-100 text-yellow-800',
  10: 'bg-red-100 text-red-800',
};

const categoriaColors = {
  atendimento: 'bg-blue-100 text-blue-800',
  avaliacao: 'bg-yellow-100 text-yellow-800',
  feedback: 'bg-green-100 text-green-800',
  especial: 'bg-purple-100 text-purple-800',
};

export default function GamificacaoPage() {
  const [atendenteAtual] = useState<Atendente>(mockAtendentes[0]);
  const [tabAtiva, setTabAtiva] = useState('ranking');

  const handleResgatar = (metaId: string) => {
    toast.success('Recompensa resgatada com sucesso!');
  };

  const calcularProgressoExperiencia = (
    experiencia: number,
    proximoNivel: number
  ) => {
    return (experiencia / proximoNivel) * 100;
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gamificação</h1>
          <p className="text-muted-foreground">
            Sistema de pontuação, conquistas e rankings
          </p>
        </div>
      </div>

      {/* Perfil do Atendente Atual */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarImage
                src={atendenteAtual.avatar}
                alt={atendenteAtual.nome}
              />
              <AvatarFallback className="text-blue-600">
                {atendenteAtual.nome
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{atendenteAtual.nome}</h2>
                <Badge
                  className={`${nivelColors[atendenteAtual.nivel as keyof typeof nivelColors]} border-white`}
                >
                  Nível {atendenteAtual.nivel}
                </Badge>
                {atendenteAtual.posicaoRanking === 1 && (
                  <Crown className="h-6 w-6 text-yellow-300" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {atendenteAtual.pontuacao} pontos
                </span>
                <span className="flex items-center gap-1">
                  <Medal className="h-4 w-4" />#{atendenteAtual.posicaoRanking}{' '}
                  no ranking
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {atendenteAtual.conquistas.length} conquistas
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Experiência para o próximo nível</span>
                <span>
                  {atendenteAtual.experiencia}/
                  {atendenteAtual.experienciaProximoNivel} XP
                </span>
              </div>
              <Progress
                value={calcularProgressoExperiencia(
                  atendenteAtual.experiencia,
                  atendenteAtual.experienciaProximoNivel
                )}
                className="h-2 bg-white/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {atendenteAtual.metasAtingidas}
                </div>
                <div className="text-sm opacity-90">Metas Atingidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(
                    (atendenteAtual.metasAtingidas /
                      atendenteAtual.totalMetas) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm opacity-90">Taxa de Sucesso</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Ranking Geral
              </CardTitle>
              <CardDescription>
                Classificação baseada na pontuação total dos atendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAtendentes.map((atendente, index) => (
                  <div
                    key={atendente.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={atendente.avatar}
                          alt={atendente.nome}
                        />
                        <AvatarFallback>
                          {atendente.nome
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {atendente.nome}
                          {index === 0 && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Nível {atendente.nivel} •{' '}
                          {atendente.conquistas.length} conquistas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {atendente.pontuacao} pts
                      </div>
                      <Badge
                        className={
                          nivelColors[
                            atendente.nivel as keyof typeof nivelColors
                          ]
                        }
                      >
                        Nível {atendente.nivel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conquistas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockConquistas.map(conquista => (
              <Card
                key={conquista.id}
                className={`${conquista.desbloqueada ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{conquista.icone}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {conquista.nome}
                      </CardTitle>
                      <Badge className={categoriaColors[conquista.categoria]}>
                        {conquista.categoria.charAt(0).toUpperCase() +
                          conquista.categoria.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {conquista.descricao}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{conquista.pontos} pontos</span>
                    </div>
                    {conquista.desbloqueada ? (
                      <Badge variant="default" className="bg-green-600">
                        Desbloqueada
                      </Badge>
                    ) : (
                      <Badge variant="outline">Bloqueada</Badge>
                    )}
                  </div>
                  {conquista.desbloqueada && conquista.dataDesbloqueio && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Desbloqueada em: {formatarData(conquista.dataDesbloqueio)}
                    </p>
                  )}
                  {!conquista.desbloqueada && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Requisito: {conquista.requisito}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <div className="grid gap-4">
            {mockMetas.map(meta => (
              <Card
                key={meta.id}
                className={
                  meta.status === 'concluida'
                    ? 'border-green-200 bg-green-50'
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {meta.titulo}
                      </CardTitle>
                      <CardDescription>{meta.descricao}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          meta.tipo === 'diaria'
                            ? 'default'
                            : meta.tipo === 'semanal'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {meta.tipo.charAt(0).toUpperCase() + meta.tipo.slice(1)}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {meta.recompensa} pontos
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>
                          {meta.progresso}/{meta.objetivo}
                        </span>
                      </div>
                      <Progress
                        value={(meta.progresso / meta.objetivo) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Prazo: {formatarData(meta.dataLimite)}
                      </span>
                      {meta.status === 'concluida' ? (
                        <Button
                          size="sm"
                          onClick={() => handleResgatar(meta.id)}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Resgatar
                        </Button>
                      ) : (
                        <Badge
                          variant={
                            meta.status === 'ativa' ? 'default' : 'destructive'
                          }
                        >
                          {meta.status === 'ativa'
                            ? 'Em Andamento'
                            : 'Expirada'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recompensas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Vale Desconto 10%
                </CardTitle>
                <CardDescription>Desconto em produtos da loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-center">
                    500 pontos
                  </div>
                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Dia de Folga Extra
                </CardTitle>
                <CardDescription>Um dia adicional de descanso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-center">
                    1000 pontos
                  </div>
                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Certificado de Excelência
                </CardTitle>
                <CardDescription>Reconhecimento oficial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-center">
                    2000 pontos
                  </div>
                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
