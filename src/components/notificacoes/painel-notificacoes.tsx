'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNotificacoesAvaliacoes } from '@/hooks/use-notificacoes-avaliacoes';
import { useEmailNotificacoes } from '@/hooks/use-email-notificacoes';
import {
  Bell,
  Mail,
  Settings,
  Clock,
  Users,
  BarChart3,
  RefreshCw,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
} from 'lucide-react';

interface PainelNotificacoesProps {
  usuarioId?: string;
  className?: string;
}

interface FiltrosNotificacao {
  status: 'todas' | 'pendentes' | 'lidas';
  urgencia: 'todas' | 'baixa' | 'media' | 'alta';
  tipo: 'todas' | 'pendente' | 'vencimento_proximo' | 'vencida';
  busca: string;
}

const PainelNotificacoes: React.FC<PainelNotificacoesProps> = ({
  usuarioId,
  className = '',
}) => {
  const { toast } = useToast();
  const {
    notificacoes,
    estatisticas,
    configuracao,
    carregando,
    erro,
    buscarNotificacoes,
    marcarComoLida,
    atualizarConfiguracao,
  } = useNotificacoesAvaliacoes(usuarioId);

  const {
    enviarEmail,
    estatisticasEmail,
    carregandoEnvio,
  } = useEmailNotificacoes();

  const [filtros, setFiltros] = useState<FiltrosNotificacao>({
    status: 'todas',
    urgencia: 'todas',
    tipo: 'todas',
    busca: '',
  });

  const [configuracaoLocal, setConfiguracaoLocal] = useState({
    notificacoesAtivas: true,
    diasAntecedencia: 3,
    horarioNotificacao: '09:00',
    tiposNotificacao: {
      avaliacaoPendente: true,
      lembreteVencimento: true,
      avaliacaoVencida: true,
    },
  });

  // Sincronizar configuração local com a do servidor
  useEffect(() => {
    if (configuracao) {
      setConfiguracaoLocal({
        notificacoesAtivas: configuracao.notificacoesAtivas,
        diasAntecedencia: configuracao.diasAntecedencia,
        horarioNotificacao: configuracao.horarioNotificacao,
        tiposNotificacao: configuracao.tiposNotificacao,
      });
    }
  }, [configuracao]);

  // Filtrar notificações
  const notificacoesFiltradas = notificacoes.filter(notificacao => {
    if (filtros.status !== 'todas') {
      if (filtros.status === 'lidas' && !notificacao.lida) return false;
      if (filtros.status === 'pendentes' && notificacao.lida) return false;
    }

    if (filtros.urgencia !== 'todas' && notificacao.urgencia !== filtros.urgencia) {
      return false;
    }

    if (filtros.tipo !== 'todas' && notificacao.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      return (
        notificacao.titulo.toLowerCase().includes(busca) ||
        notificacao.mensagem.toLowerCase().includes(busca)
      );
    }

    return true;
  });

  const handleSalvarConfiguracao = async () => {
    try {
      await atualizarConfiguracao(configuracaoLocal);
      toast({
        title: 'Configuração salva',
        description: 'As configurações de notificação foram atualizadas com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const handleEnviarEmailTeste = async () => {
    try {
      await enviarEmail({
        tipo: 'avaliacao_pendente',
        destinatarios: [{
          usuarioId: usuarioId || '',
          email: 'teste@exemplo.com',
          nome: 'Usuário Teste',
        }],
        dadosPersonalizacao: {
          avaliacaoId: 'teste',
          nomeAvaliacao: 'Avaliação de Teste',
          prazoVencimento: new Date().toISOString(),
          urlAvaliacao: '/avaliacoes/teste',
        },
      });

      toast({
        title: 'E-mail enviado',
        description: 'E-mail de teste enviado com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Erro no envio',
        description: 'Não foi possível enviar o e-mail de teste.',
        variant: 'destructive',
      });
    }
  };

  const obterCorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'outline';
    }
  };

  const obterIconeStatus = (lida: boolean) => {
    return lida ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-orange-500" />
    );
  };

  if (erro) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Erro ao carregar notificações: {erro}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{estatisticas?.totalPendentes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Vencidas</p>
                <p className="text-2xl font-bold">{estatisticas?.totalVencidas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">E-mails</p>
                <p className="text-2xl font-bold">{estatisticasEmail?.totalEnviados || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Taxa Leitura</p>
                <p className="text-2xl font-bold">
                  {estatisticas?.porcentagemLeitura?.toFixed(0) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel Principal */}
      <Tabs defaultValue="notificacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notificacoes">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="configuracoes">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            E-mail
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* Aba de Notificações */}
        <TabsContent value="notificacoes" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filtros.status}
                    onValueChange={(value: any) => setFiltros(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="pendentes">Pendentes</SelectItem>
                      <SelectItem value="lidas">Lidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgência</Label>
                  <Select
                    value={filtros.urgencia}
                    onValueChange={(value: any) => setFiltros(prev => ({ ...prev, urgencia: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={filtros.tipo}
                    onValueChange={(value: any) => setFiltros(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="vencimento_proximo">Vencimento Próximo</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar notificações..."
                      value={filtros.busca}
                      onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {notificacoesFiltradas.length} de {notificacoes.length} notificações
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => buscarNotificacoes()}
                  disabled={carregando}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${carregando ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Lista de todas as notificações de avaliações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {notificacoesFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma notificação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notificacoesFiltradas.map((notificacao) => (
                      <Card key={notificacao.id} className={`transition-colors ${
                        !notificacao.lida ? 'border-blue-200 bg-blue-50/50' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {obterIconeStatus(notificacao.lida)}
                                <h4 className="font-medium">{notificacao.titulo}</h4>
                                <Badge variant={obterCorUrgencia(notificacao.urgencia)}>
                                  {notificacao.urgencia}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notificacao.mensagem}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(notificacao.dataVencimento).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {notificacao.diasRestantes} dias restantes
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!notificacao.lida && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => marcarComoLida(notificacao.id)}
                                >
                                  Marcar como lida
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Ativas</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar ou desativar todas as notificações
                  </p>
                </div>
                <Switch
                  checked={configuracaoLocal.notificacoesAtivas}
                  onCheckedChange={(checked) => 
                    setConfiguracaoLocal(prev => ({ ...prev, notificacoesAtivas: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias de Antecedência</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={configuracaoLocal.diasAntecedencia}
                    onChange={(e) => 
                      setConfiguracaoLocal(prev => ({ 
                        ...prev, 
                        diasAntecedencia: parseInt(e.target.value) || 3 
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horário de Notificação</Label>
                  <Input
                    type="time"
                    value={configuracaoLocal.horarioNotificacao}
                    onChange={(e) => 
                      setConfiguracaoLocal(prev => ({ 
                        ...prev, 
                        horarioNotificacao: e.target.value 
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Tipos de Notificação</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Avaliação Pendente</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre avaliações que precisam ser realizadas
                      </p>
                    </div>
                    <Switch
                      checked={configuracaoLocal.tiposNotificacao.avaliacaoPendente}
                      onCheckedChange={(checked) => 
                        setConfiguracaoLocal(prev => ({
                          ...prev,
                          tiposNotificacao: {
                            ...prev.tiposNotificacao,
                            avaliacaoPendente: checked
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lembrete de Vencimento</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando o prazo está próximo
                      </p>
                    </div>
                    <Switch
                      checked={configuracaoLocal.tiposNotificacao.lembreteVencimento}
                      onCheckedChange={(checked) => 
                        setConfiguracaoLocal(prev => ({
                          ...prev,
                          tiposNotificacao: {
                            ...prev.tiposNotificacao,
                            lembreteVencimento: checked
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Avaliação Vencida</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre avaliações que já venceram
                      </p>
                    </div>
                    <Switch
                      checked={configuracaoLocal.tiposNotificacao.avaliacaoVencida}
                      onCheckedChange={(checked) => 
                        setConfiguracaoLocal(prev => ({
                          ...prev,
                          tiposNotificacao: {
                            ...prev.tiposNotificacao,
                            avaliacaoVencida: checked
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSalvarConfiguracao}>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de E-mail */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de E-mail</CardTitle>
              <CardDescription>
                Gerencie as configurações de envio de e-mails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">E-mails Enviados</h4>
                    </div>
                    <p className="text-2xl font-bold">{estatisticasEmail?.totalEnviados || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Taxa de Sucesso</h4>
                    </div>
                    <p className="text-2xl font-bold">
                      {estatisticasEmail?.taxaSucesso?.toFixed(1) || 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Teste de E-mail</h4>
                <p className="text-sm text-muted-foreground">
                  Envie um e-mail de teste para verificar se as configurações estão funcionando
                </p>
                <Button
                  onClick={handleEnviarEmailTeste}
                  disabled={carregandoEnvio}
                >
                  {carregandoEnvio ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar E-mail de Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Pendentes:</span>
                    <span className="font-medium">{estatisticas?.totalPendentes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Vencidas:</span>
                    <span className="font-medium">{estatisticas?.totalVencidas || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Enviadas:</span>
                    <span className="font-medium">{estatisticas?.totalEnviadas || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Lidas:</span>
                    <span className="font-medium">{estatisticas?.totalLidas || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Taxa de Leitura:</span>
                    <span className="font-medium">
                      {estatisticas?.porcentagemLeitura?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de E-mail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>E-mails Enviados:</span>
                    <span className="font-medium">{estatisticasEmail?.totalEnviados || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sucessos:</span>
                    <span className="font-medium">{estatisticasEmail?.sucessos || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Falhas:</span>
                    <span className="font-medium">{estatisticasEmail?.falhas || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Taxa de Sucesso:</span>
                    <span className="font-medium">
                      {estatisticasEmail?.taxaSucesso?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última Verificação:</span>
                    <span className="font-medium text-sm">
                      {estatisticas?.ultimaVerificacao 
                        ? new Date(estatisticas.ultimaVerificacao).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PainelNotificacoes;