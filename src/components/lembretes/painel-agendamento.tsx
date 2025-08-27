'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgendadorLembretes } from '@/hooks/use-lembretes';
import { Play, Pause, RefreshCw, Settings, Clock, Calendar, Mail, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PainelAgendamentoProps {
  className?: string;
}

export function PainelAgendamento({ className }: PainelAgendamentoProps) {
  const { status, carregando, erro, atualizarConfiguracao, executarAcao } = useAgendadorLembretes();
  const [configuracaoLocal, setConfiguracaoLocal] = useState(status?.configuracao || {
    diasAntecedencia: [1, 3, 7],
    horarioEnvio: '09:00',
    ativo: false,
    incluirFimDeSemana: false,
    incluirFeriados: false,
  });
  const [salvando, setSalvando] = useState(false);

  // Atualizar configuração local quando status mudar
  React.useEffect(() => {
    if (status?.configuracao) {
      setConfiguracaoLocal(status.configuracao);
    }
  }, [status]);

  const handleSalvarConfiguracao = async () => {
    setSalvando(true);
    await atualizarConfiguracao(configuracaoLocal);
    setSalvando(false);
  };

  const handleIniciarParar = async () => {
    const acao = status?.ativo ? 'parar' : 'iniciar';
    await executarAcao(acao);
  };

  const handleForcarVerificacao = async () => {
    await executarAcao('verificar');
  };

  const handleAdicionarDia = () => {
    const novoDia = prompt('Digite o número de dias de antecedência (1-30):');
    if (novoDia && !isNaN(Number(novoDia))) {
      const dia = Number(novoDia);
      if (dia >= 1 && dia <= 30 && !configuracaoLocal.diasAntecedencia.includes(dia)) {
        setConfiguracaoLocal(prev => ({
          ...prev,
          diasAntecedencia: [...prev.diasAntecedencia, dia].sort((a, b) => a - b)
        }));
      }
    }
  };

  const handleRemoverDia = (dia: number) => {
    setConfiguracaoLocal(prev => ({
      ...prev,
      diasAntecedencia: prev.diasAntecedencia.filter(d => d !== dia)
    }));
  };

  const getStatusIcon = () => {
    if (carregando) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (erro) return <XCircle className="h-4 w-4 text-red-500" />;
    if (status?.ativo) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (carregando) return 'Carregando...';
    if (erro) return 'Erro';
    if (status?.ativo) return 'Ativo';
    return 'Inativo';
  };

  const getStatusColor = () => {
    if (carregando) return 'default';
    if (erro) return 'destructive';
    if (status?.ativo) return 'default';
    return 'secondary';
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agendamento de Lembretes
              </CardTitle>
              <CardDescription>
                Configure e gerencie o agendamento automático de lembretes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {erro && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="configuracao" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
              <TabsTrigger value="controle">Controle</TabsTrigger>
            </TabsList>

            <TabsContent value="configuracao" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Agendamento Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar ou desativar o agendamento automático
                    </p>
                  </div>
                  <Switch
                    checked={configuracaoLocal.ativo}
                    onCheckedChange={(checked) => 
                      setConfiguracaoLocal(prev => ({ ...prev, ativo: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="horario">Horário de Envio</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={configuracaoLocal.horarioEnvio}
                    onChange={(e) => 
                      setConfiguracaoLocal(prev => ({ ...prev, horarioEnvio: e.target.value }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Horário em que os lembretes serão enviados diariamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Dias de Antecedência</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {configuracaoLocal.diasAntecedencia.map((dia) => (
                      <Badge
                        key={dia}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleRemoverDia(dia)}
                      >
                        {dia} {dia === 1 ? 'dia' : 'dias'}
                        <XCircle className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAdicionarDia}
                      className="h-6"
                    >
                      + Adicionar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quantos dias antes do prazo os lembretes serão enviados
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Fins de Semana</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes aos sábados e domingos
                    </p>
                  </div>
                  <Switch
                    checked={configuracaoLocal.incluirFimDeSemana}
                    onCheckedChange={(checked) => 
                      setConfiguracaoLocal(prev => ({ ...prev, incluirFimDeSemana: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Incluir Feriados</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes em feriados nacionais
                    </p>
                  </div>
                  <Switch
                    checked={configuracaoLocal.incluirFeriados}
                    onCheckedChange={(checked) => 
                      setConfiguracaoLocal(prev => ({ ...prev, incluirFeriados: checked }))
                    }
                  />
                </div>

                <Button
                  onClick={handleSalvarConfiguracao}
                  disabled={salvando || carregando}
                  className="w-full"
                >
                  {salvando ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configuração
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="estatisticas" className="space-y-4">
              {status?.estatisticas && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Total Agendados</p>
                          <p className="text-2xl font-bold">{status.estatisticas.totalAgendados}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Enviados</p>
                          <p className="text-2xl font-bold">{status.estatisticas.totalEnviados}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">Pendentes</p>
                          <p className="text-2xl font-bold">{status.estatisticas.totalPendentes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Falhas</p>
                          <p className="text-2xl font-bold">{status.estatisticas.totalFalhas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {status?.estatisticas?.proximosEnvios && status.estatisticas.proximosEnvios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Próximos Envios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {status.estatisticas.proximosEnvios.slice(0, 5).map((lembrete) => (
                        <div key={lembrete.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{lembrete.usuario.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {lembrete.avaliacao.avaliado.nome} - {lembrete.tipo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {format(new Date(lembrete.dataEnvio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                            <Badge variant={lembrete.tipo === 'vencimento' ? 'destructive' : 'default'}>
                              {lembrete.tipo}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {status?.estatisticas?.ultimosEnviados && status.estatisticas.ultimosEnviados.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Últimos Enviados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {status.estatisticas.ultimosEnviados.slice(0, 5).map((lembrete) => (
                        <div key={lembrete.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{lembrete.usuario.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {lembrete.avaliacao.avaliado.nome} - {lembrete.tipo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {lembrete.dataEnvioReal && format(new Date(lembrete.dataEnvioReal), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                            <Badge variant={lembrete.enviado ? 'default' : 'destructive'}>
                              {lembrete.enviado ? 'Enviado' : 'Falha'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="controle" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Controles do Agendador</CardTitle>
                    <CardDescription>
                      Gerencie o funcionamento do agendador de lembretes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleIniciarParar}
                        disabled={carregando}
                        variant={status?.ativo ? 'destructive' : 'default'}
                        className="flex-1"
                      >
                        {status?.ativo ? (
                          <Pause className="h-4 w-4 mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {status?.ativo ? 'Parar' : 'Iniciar'} Agendador
                      </Button>

                      <Button
                        onClick={handleForcarVerificacao}
                        disabled={carregando || !status?.ativo}
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verificar Agora
                      </Button>
                    </div>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Atenção:</strong> Parar o agendador impedirá o envio automático de lembretes.
                        Certifique-se de que esta ação é necessária.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Avançadas</CardTitle>
                    <CardDescription>
                      Operações especiais para manutenção do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => executarAcao('limpar')}
                      disabled={carregando}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Limpar Lembretes Pendentes
                    </Button>

                    <Button
                      onClick={() => executarAcao('resetar')}
                      disabled={carregando}
                      variant="outline"
                      className="w-full"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Resetar Configuração
                    </Button>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Cuidado:</strong> As ações acima são irreversíveis e podem afetar
                        o funcionamento do sistema de lembretes.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default PainelAgendamento;