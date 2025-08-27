'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bell, 
  Mail, 
  Clock, 
  Filter, 
  Pause, 
  Play, 
  RotateCcw, 
  Save, 
  Calendar as CalendarIcon,
  AlertTriangle,
  Info,
  Settings
} from 'lucide-react';
import { usePreferenciasNotificacao } from '@/hooks/use-preferencias-notificacao';
import { PreferenciasNotificacaoInput } from '@/lib/types/preferencias-notificacao';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ConfiguracoesNotificacaoProps {
  className?: string;
}

export function ConfiguracoesNotificacao({ className }: ConfiguracoesNotificacaoProps) {
  const {
    preferencias,
    carregando,
    erro,
    atualizarPreferencias,
    resetarPreferencias,
    pausarNotificacoes,
    retomarNotificacoes,
  } = usePreferenciasNotificacao();

  const [configuracoes, setConfiguracoes] = useState<PreferenciasNotificacaoInput>({});
  const [salvando, setSalvando] = useState(false);
  const [dialogPausa, setDialogPausa] = useState(false);
  const [dataFimPausa, setDataFimPausa] = useState<Date>();
  const [motivoPausa, setMotivoPausa] = useState('');

  // Atualiza configurações locais quando preferências carregam
  React.useEffect(() => {
    if (preferencias) {
      setConfiguracoes({
        notificacoesAtivas: preferencias.notificacoesAtivas,
        emailAtivo: preferencias.emailAtivo,
        diasAntecedenciaLembrete: preferencias.diasAntecedenciaLembrete,
        horarioEnvio: preferencias.horarioEnvio,
        incluirFinsDeSemanaSemana: preferencias.incluirFinsDeSemanaSemana,
        incluirFeriados: preferencias.incluirFeriados,
        tiposNotificacao: { ...preferencias.tiposNotificacao },
        urgenciaMinima: preferencias.urgenciaMinima,
        frequenciaLembretes: { ...preferencias.frequenciaLembretes },
        incluirDetalhesAvaliacao: preferencias.incluirDetalhesAvaliacao,
        incluirLinkDireto: preferencias.incluirLinkDireto,
        incluirResumoEstatisticas: preferencias.incluirResumoEstatisticas,
        formatoEmail: preferencias.formatoEmail,
        idiomaNotificacao: preferencias.idiomaNotificacao,
        filtros: { ...preferencias.filtros },
      });
    }
  }, [preferencias]);

  const handleSalvar = async () => {
    setSalvando(true);
    await atualizarPreferencias(configuracoes);
    setSalvando(false);
  };

  const handleResetar = async () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações para os valores padrão?')) {
      await resetarPreferencias();
    }
  };

  const handlePausarNotificacoes = async () => {
    if (!dataFimPausa) return;
    
    const sucesso = await pausarNotificacoes(dataFimPausa, new Date(), motivoPausa);
    if (sucesso) {
      setDialogPausa(false);
      setDataFimPausa(undefined);
      setMotivoPausa('');
    }
  };

  const handleRetomarNotificacoes = async () => {
    if (confirm('Tem certeza que deseja retomar as notificações?')) {
      await retomarNotificacoes();
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfiguracoes(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedConfig = (parent: string, key: string, value: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof PreferenciasNotificacaoInput],
        [key]: value,
      },
    }));
  };

  if (carregando && !preferencias) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const notificacoesPausadas = preferencias?.pausarNotificacoes?.ativo;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Status das Notificações */}
      {notificacoesPausadas && (
        <Alert>
          <Pause className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Notificações pausadas até{' '}
              {preferencias?.pausarNotificacoes?.dataFim && 
                format(new Date(preferencias.pausarNotificacoes.dataFim), 'dd/MM/yyyy', { locale: ptBR })
              }
              {preferencias?.pausarNotificacoes?.motivo && (
                <span className="text-muted-foreground ml-2">
                  - {preferencias.pausarNotificacoes.motivo}
                </span>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetomarNotificacoes}
              className="ml-4"
            >
              <Play className="h-4 w-4 mr-2" />
              Retomar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
          <CardDescription>
            Configure como e quando você deseja receber notificações sobre avaliações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="geral" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="tipos">Tipos</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="filtros">Filtros</TabsTrigger>
            </TabsList>

            {/* Configurações Gerais */}
            <TabsContent value="geral" className="space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações Ativas</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar ou desativar todas as notificações
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.notificacoesAtivas ?? false}
                    onCheckedChange={(checked) => updateConfig('notificacoesAtivas', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Notificações por E-mail
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.emailAtivo ?? false}
                    onCheckedChange={(checked) => updateConfig('emailAtivo', checked)}
                    disabled={!configuracoes.notificacoesAtivas}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato do E-mail</Label>
                    <Select
                      value={configuracoes.formatoEmail || 'HTML'}
                      onValueChange={(value) => updateConfig('formatoEmail', value)}
                      disabled={!configuracoes.emailAtivo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HTML">HTML (Rico)</SelectItem>
                        <SelectItem value="TEXTO">Texto Simples</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select
                      value={configuracoes.idiomaNotificacao || 'PT_BR'}
                      onValueChange={(value) => updateConfig('idiomaNotificacao', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PT_BR">Português (BR)</SelectItem>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Conteúdo das Notificações</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Incluir detalhes da avaliação</Label>
                      <Switch
                        checked={configuracoes.incluirDetalhesAvaliacao ?? true}
                        onCheckedChange={(checked) => updateConfig('incluirDetalhesAvaliacao', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Incluir link direto</Label>
                      <Switch
                        checked={configuracoes.incluirLinkDireto ?? true}
                        onCheckedChange={(checked) => updateConfig('incluirLinkDireto', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Incluir resumo de estatísticas</Label>
                      <Switch
                        checked={configuracoes.incluirResumoEstatisticas ?? false}
                        onCheckedChange={(checked) => updateConfig('incluirResumoEstatisticas', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tipos de Notificação */}
            <TabsContent value="tipos" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Urgência Mínima</Label>
                  <Select
                    value={configuracoes.urgenciaMinima || 'BAIXA'}
                    onValueChange={(value) => updateConfig('urgenciaMinima', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXA">Baixa</SelectItem>
                      <SelectItem value="MEDIA">Média</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Receber apenas notificações com urgência igual ou superior
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Tipos de Notificação</Label>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'avaliacaoPendente', label: 'Avaliação Pendente', desc: 'Quando há avaliações aguardando' },
                      { key: 'avaliacaoVencida', label: 'Avaliação Vencida', desc: 'Quando uma avaliação passou do prazo' },
                      { key: 'avaliacaoProximaVencimento', label: 'Próxima do Vencimento', desc: 'Quando uma avaliação está próxima do prazo' },
                      { key: 'novaAvaliacaoRecebida', label: 'Nova Avaliação', desc: 'Quando recebe uma nova avaliação' },
                      { key: 'avaliacaoCompletada', label: 'Avaliação Completada', desc: 'Quando uma avaliação é finalizada' },
                      { key: 'lembretePersonalizado', label: 'Lembrete Personalizado', desc: 'Lembretes criados manualmente' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-normal">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={configuracoes.tiposNotificacao?.[key as keyof typeof configuracoes.tiposNotificacao] ?? true}
                          onCheckedChange={(checked) => updateNestedConfig('tiposNotificacao', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Frequência de Lembretes</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Avaliações Pendentes</Label>
                      <Select
                        value={configuracoes.frequenciaLembretes?.avaliacaoPendente || 'SEMANAL'}
                        onValueChange={(value) => updateNestedConfig('frequenciaLembretes', 'avaliacaoPendente', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIARIO">Diário</SelectItem>
                          <SelectItem value="SEMANAL">Semanal</SelectItem>
                          <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                          <SelectItem value="MENSAL">Mensal</SelectItem>
                          <SelectItem value="NUNCA">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Avaliações Vencidas</Label>
                      <Select
                        value={configuracoes.frequenciaLembretes?.avaliacaoVencida || 'DIARIO'}
                        onValueChange={(value) => updateNestedConfig('frequenciaLembretes', 'avaliacaoVencida', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIARIO">Diário</SelectItem>
                          <SelectItem value="SEMANAL">Semanal</SelectItem>
                          <SelectItem value="NUNCA">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Configurações de Timing */}
            <TabsContent value="timing" className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dias de Antecedência</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={configuracoes.diasAntecedenciaLembrete || 3}
                      onChange={(e) => updateConfig('diasAntecedenciaLembrete', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantos dias antes do prazo enviar lembretes
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Horário de Envio</Label>
                    <Input
                      type="time"
                      value={configuracoes.horarioEnvio || '09:00'}
                      onChange={(e) => updateConfig('horarioEnvio', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Horário preferido para receber notificações
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Configurações de Calendário</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-normal">Incluir fins de semana</Label>
                        <p className="text-xs text-muted-foreground">
                          Enviar notificações aos sábados e domingos
                        </p>
                      </div>
                      <Switch
                        checked={configuracoes.incluirFinsDeSemanaSemana ?? false}
                        onCheckedChange={(checked) => updateConfig('incluirFinsDeSemanaSemana', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-normal">Incluir feriados</Label>
                        <p className="text-xs text-muted-foreground">
                          Enviar notificações em feriados nacionais
                        </p>
                      </div>
                      <Switch
                        checked={configuracoes.incluirFeriados ?? false}
                        onCheckedChange={(checked) => updateConfig('incluirFeriados', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Filtros */}
            <TabsContent value="filtros" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros de Conteúdo
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-normal">Apenas minhas avaliações</Label>
                        <p className="text-xs text-muted-foreground">
                          Receber apenas notificações sobre avaliações que preciso fazer
                        </p>
                      </div>
                      <Switch
                        checked={configuracoes.filtros?.apenasMinhasAvaliacoes ?? false}
                        onCheckedChange={(checked) => updateNestedConfig('filtros', 'apenasMinhasAvaliacoes', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-normal">Apenas avaliações que eu avalio</Label>
                        <p className="text-xs text-muted-foreground">
                          Receber apenas notificações sobre pessoas que avalio
                        </p>
                      </div>
                      <Switch
                        checked={configuracoes.filtros?.apenasAvaliacoesQueEuAvalio ?? false}
                        onCheckedChange={(checked) => updateNestedConfig('filtros', 'apenasAvaliacoesQueEuAvalio', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Filtros por Departamento/Cargo</Label>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Funcionalidade em desenvolvimento. Em breve você poderá filtrar notificações por departamentos e cargos específicos.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Ações */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex gap-2">
              {!notificacoesPausadas ? (
                <Dialog open={dialogPausa} onOpenChange={setDialogPausa}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar Notificações
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pausar Notificações</DialogTitle>
                      <DialogDescription>
                        Escolha até quando deseja pausar as notificações.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Data de Retomada</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !dataFimPausa && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dataFimPausa ? format(dataFimPausa, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dataFimPausa}
                              onSelect={setDataFimPausa}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo (opcional)</Label>
                        <Textarea
                          placeholder="Ex: Férias, licença médica, etc."
                          value={motivoPausa}
                          onChange={(e) => setMotivoPausa(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogPausa(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handlePausarNotificacoes} disabled={!dataFimPausa}>
                        Pausar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button variant="outline" size="sm" onClick={handleRetomarNotificacoes}>
                  <Play className="h-4 w-4 mr-2" />
                  Retomar Notificações
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={handleResetar}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </div>
            
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}