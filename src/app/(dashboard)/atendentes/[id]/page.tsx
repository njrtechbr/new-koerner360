'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  Activity,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Importar componentes de métricas
import { DashboardMetricas } from '@/components/metricas/dashboard-metricas';
import { GraficosDesempenho } from '@/components/metricas/graficos-desempenho';
import { IndicadoresProdutividade } from '@/components/metricas/indicadores-produtividade';

// Tipos
interface DadosAtendente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo: string;
  setor: string;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  dataAdmissao: string;
  ultimoAcesso?: string;
  foto?: string;
}

interface MetricasAtendente {
  atendente: {
    id: string;
    nome: string;
    cargo: string;
    setor: string;
  };
  periodo: {
    dataInicio: string;
    dataFim: string;
    periodo: string;
  };
  avaliacoes: {
    total: number;
    media: number;
    ultima?: {
      nota: number;
      data: string;
    };
  };
  documentos: {
    total: number;
    ativosNoPeriodo: number;
  };
  atividade: {
    totalAlteracoes: number;
    porTipo: Record<string, number>;
  };
  resumo: {
    produtividade: string;
    statusGeral: string;
  };
}

/**
 * Página de visualização de métricas de atendente individual
 */
export default function PaginaAtendenteIndividual() {
  const params = useParams();
  const router = useRouter();
  const atendenteId = params.id as string;

  // Estados
  const [atendente, setAtendente] = useState<DadosAtendente | null>(null);
  const [metricas, setMetricas] = useState<MetricasAtendente | null>(null);
  const [carregandoAtendente, setCarregandoAtendente] = useState(true);
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Buscar dados do atendente
  const buscarAtendente = async () => {
    try {
      setCarregandoAtendente(true);
      setErro(null);

      const response = await fetch(`/api/atendentes/${atendenteId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Atendente não encontrado');
        }
        throw new Error('Erro ao carregar dados do atendente');
      }

      const data = await response.json();
      setAtendente(data.atendente);
    } catch (error) {
      console.error('Erro ao buscar atendente:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro ao carregar dados do atendente');
    } finally {
      setCarregandoAtendente(false);
    }
  };

  // Buscar métricas do atendente
  const buscarMetricas = async () => {
    try {
      setCarregandoMetricas(true);

      const response = await fetch(`/api/atendentes/${atendenteId}/metricas`);

      if (!response.ok) {
        throw new Error('Erro ao carregar métricas');
      }

      const data = await response.json();
      setMetricas(data.metricas);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast.error('Erro ao carregar métricas do atendente');
    } finally {
      setCarregandoMetricas(false);
    }
  };

  // Efeitos
  useEffect(() => {
    if (atendenteId) {
      buscarAtendente();
      buscarMetricas();
    }
  }, [atendenteId]);

  // Função para voltar
  const handleVoltar = () => {
    router.push('/dashboard/atendentes');
  };

  // Função para obter cor do status
  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-100 text-green-800';
      case 'INATIVO':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENSO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Renderizar erro
  if (erro) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {carregandoAtendente ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              `Métricas - ${atendente?.nome || 'Atendente'}`
            )}
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho individual em tempo real
          </p>
        </div>
      </div>

      {/* Informações do Atendente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Atendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoAtendente ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          ) : atendente ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Nome
                </div>
                <p className="font-medium">{atendente.nome}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="font-medium">{atendente.email}</p>
              </div>

              {atendente.telefone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </div>
                  <p className="font-medium">{atendente.telefone}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Cargo
                </div>
                <p className="font-medium">{atendente.cargo}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Setor
                </div>
                <p className="font-medium">{atendente.setor}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  Status
                </div>
                <Badge className={obterCorStatus(atendente.status)}>
                  {atendente.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Data de Admissão
                </div>
                <p className="font-medium">
                  {new Date(atendente.dataAdmissao).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {atendente.ultimoAcesso && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Último Acesso
                  </div>
                  <p className="font-medium">
                    {new Date(atendente.ultimoAcesso).toLocaleDateString(
                      'pt-BR'
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Separator />

      {/* Dashboard de Métricas */}
      <DashboardMetricas
        atendenteId={atendenteId}
        tempoRealAtivo={true}
        intervaloAtualizacao={30000}
      />
    </div>
  );
}
