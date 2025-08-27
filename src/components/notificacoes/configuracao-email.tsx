'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Settings,
  Clock,
  Bell,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Save,
  RotateCcw,
  TestTube
} from 'lucide-react';
import { useEmailNotificacoes, useEstatisticasEmail } from '@/hooks/use-email-notificacoes';
import { ConfiguracaoEmail, TipoNotificacaoEmail } from '@/lib/utils/email-notificacoes';
import { toast } from 'sonner';

/**
 * Interface para configurações de e-mail do usuário
 */
export interface ConfiguracaoEmailUsuario {
  id?: string;
  usuarioId: string;
  emailAtivo: boolean;
  emailPrincipal: string;
  emailsAdicionais: string[];
  frequenciaNotificacoes: 'imediata' | 'diaria' | 'semanal';
  tiposHabilitados: TipoNotificacaoEmail[];
  horarioPreferido: string;
  diasAntecedencia: number;
  incluirResumo: boolean;
  formatoHtml: boolean;
  assinatura?: string;
}

/**
 * Props do componente
 */
interface ConfiguracaoEmailProps {
  usuarioId: string;
  configuracaoInicial?: Partial<ConfiguracaoEmailUsuario>;
  onSalvar?: (configuracao: ConfiguracaoEmailUsuario) => void;
  onTestar?: (email: string) => void;
  readonly?: boolean;
}

/**
 * Componente para configurar preferências de e-mail de notificações
 */
export function ConfiguracaoEmail({
  usuarioId,
  configuracaoInicial,
  onSalvar,
  onTestar,
  readonly = false
}: ConfiguracaoEmailProps) {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoEmailUsuario>({
    usuarioId,
    emailAtivo: true,
    emailPrincipal: '',
    emailsAdicionais: [],
    frequenciaNotificacoes: 'imediata',
    tiposHabilitados: ['avaliacao_pendente', 'lembrete_prazo'],
    horarioPreferido: '09:00',
    diasAntecedencia: 3,
    incluirResumo: true,
    formatoHtml: true,
    ...configuracaoInicial
  });

  const [novoEmail, setNovoEmail] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);

  const { enviarNotificacaoAvaliacaoPendente } = useEmailNotificacoes();
  const { estatisticas, carregarEstatisticas, obterEstatisticasGerais } = useEstatisticasEmail();

  // Carrega estatísticas ao montar o componente
  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  // Monitora alterações na configuração
  useEffect(() => {
    setAlteracoesPendentes(true);
  }, [configuracao]);

  /**
   * Atualiza campo da configuração
   */
  const atualizarConfiguracao = <K extends keyof ConfiguracaoEmailUsuario>(
    campo: K,
    valor: ConfiguracaoEmailUsuario[K]
  ) => {
    if (readonly) return;
    
    setConfiguracao(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  /**
   * Adiciona e-mail adicional
   */
  const adicionarEmail = () => {
    if (!novoEmail || !novoEmail.includes('@')) {
      toast.error('Digite um e-mail válido');
      return;
    }

    if (configuracao.emailsAdicionais.includes(novoEmail)) {
      toast.error('Este e-mail já foi adicionado');
      return;
    }

    atualizarConfiguracao('emailsAdicionais', [...configuracao.emailsAdicionais, novoEmail]);
    setNovoEmail('');
    toast.success('E-mail adicionado');
  };

  /**
   * Remove e-mail adicional
   */
  const removerEmail = (email: string) => {
    atualizarConfiguracao(
      'emailsAdicionais',
      configuracao.emailsAdicionais.filter(e => e !== email)
    );
    toast.success('E-mail removido');
  };

  /**
   * Alterna tipo de notificação
   */
  const alternarTipoNotificacao = (tipo: TipoNotificacaoEmail) => {
    const tiposAtuais = configuracao.tiposHabilitados;
    const novosTipos = tiposAtuais.includes(tipo)
      ? tiposAtuais.filter(t => t !== tipo)
      : [...tiposAtuais, tipo];
    
    atualizarConfiguracao('tiposHabilitados', novosTipos);
  };

  /**
   * Salva configuração
   */
  const salvarConfiguracao = async () => {
    if (!configuracao.emailPrincipal) {
      toast.error('E-mail principal é obrigatório');
      return;
    }

    setSalvando(true);
    try {
      await onSalvar?.(configuracao);
      setAlteracoesPendentes(false);
      toast.success('Configuração salva com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  };

  /**
   * Testa envio de e-mail
   */
  const testarEnvio = async () => {
    if (!configuracao.emailPrincipal) {
      toast.error('Configure um e-mail principal primeiro');
      return;
    }

    setTestando(true);
    try {
      await onTestar?.(configuracao.emailPrincipal);
      toast.success('E-mail de teste enviado');
    } catch (error) {
      toast.error('Erro ao enviar e-mail de teste');
      console.error('Erro no teste:', error);
    } finally {
      setTestando(false);
    }
  };

  /**
   * Reseta configuração
   */
  const resetarConfiguracao = () => {
    setConfiguracao({
      usuarioId,
      emailAtivo: true,
      emailPrincipal: '',
      emailsAdicionais: [],
      frequenciaNotificacoes: 'imediata',
      tiposHabilitados: ['avaliacao_pendente', 'lembrete_prazo'],
      horarioPreferido: '09:00',
      diasAntecedencia: 3,
      incluirResumo: true,
      formatoHtml: true,
      ...configuracaoInicial
    });
    setAlteracoesPendentes(false);
    toast.success('Configuração resetada');
  };

  const estatisticasGerais = obterEstatisticasGerais();

  const tiposNotificacao = [
    {
      tipo: 'avaliacao_pendente' as TipoNotificacaoEmail,
      label: 'Avaliação Pendente',
      descricao: 'Notifica quando uma nova avaliação é atribuída',
      icone: Bell
    },
    {
      tipo: 'lembrete_prazo' as TipoNotificacaoEmail,
      label: 'Lembrete de Prazo',
      descricao: 'Lembra sobre prazos próximos de avaliações',
      icone: Clock
    },
    {
      tipo: 'avaliacao_vencida' as TipoNotificacaoEmail,
      label: 'Avaliação Vencida',
      descricao: 'Notifica sobre avaliações que venceram',
      icone: AlertTriangle
    },
    {
      tipo: 'resumo_semanal' as TipoNotificacaoEmail,
      label: 'Resumo Semanal',
      descricao: 'Resumo semanal de todas as avaliações',
      icone: Calendar
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Configurações de E-mail</h2>
        </div>
        
        {!readonly && (
          <div className="flex items-center gap-2">
            {alteracoesPendentes && (
              <Badge variant="outline" className="text-orange-600">
                <Info className="h-3 w-3 mr-1" />
                Alterações pendentes
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetarConfiguracao}
              disabled={salvando}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Resetar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={testarEnvio}
              disabled={testando || !configuracao.emailPrincipal}
            >
              <TestTube className="h-4 w-4 mr-1" />
              {testando ? 'Testando...' : 'Testar'}
            </Button>
            
            <Button
              onClick={salvarConfiguracao}
              disabled={salvando || !alteracoesPendentes}
            >
              <Save className="h-4 w-4 mr-1" />
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Notificação</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configure suas preferências básicas de e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Ativo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar ou desativar todas as notificações por e-mail
                  </p>
                </div>
                <Switch
                  checked={configuracao.emailAtivo}
                  onCheckedChange={(checked) => atualizarConfiguracao('emailAtivo', checked)}
                  disabled={readonly}
                />
              </div>

              <Separator />

              {/* E-mail Principal */}
              <div className="space-y-2">
                <Label htmlFor="email-principal">E-mail Principal *</Label>
                <Input
                  id="email-principal"
                  type="email"
                  value={configuracao.emailPrincipal}
                  onChange={(e) => atualizarConfiguracao('emailPrincipal', e.target.value)}
                  placeholder="seu.email@empresa.com"
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground">
                  E-mail principal para receber notificações
                </p>
              </div>

              {/* E-mails Adicionais */}
              <div className="space-y-2">
                <Label>E-mails Adicionais</Label>
                
                {!readonly && (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="email.adicional@empresa.com"
                      onKeyPress={(e) => e.key === 'Enter' && adicionarEmail()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={adicionarEmail}
                      disabled={!novoEmail}
                    >
                      Adicionar
                    </Button>
                  </div>
                )}
                
                {configuracao.emailsAdicionais.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {configuracao.emailsAdicionais.map((email, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {email}
                        {!readonly && (
                          <XCircle
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removerEmail(email)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  E-mails adicionais que também receberão cópias das notificações
                </p>
              </div>

              {/* Frequência */}
              <div className="space-y-2">
                <Label>Frequência de Notificações</Label>
                <Select
                  value={configuracao.frequenciaNotificacoes}
                  onValueChange={(value: 'imediata' | 'diaria' | 'semanal') => 
                    atualizarConfiguracao('frequenciaNotificacoes', value)
                  }
                  disabled={readonly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imediata">Imediata</SelectItem>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Com que frequência você deseja receber as notificações
                </p>
              </div>

              {/* Formato */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Formato HTML</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber e-mails em formato HTML (mais visual)
                  </p>
                </div>
                <Switch
                  checked={configuracao.formatoHtml}
                  onCheckedChange={(checked) => atualizarConfiguracao('formatoHtml', checked)}
                  disabled={readonly}
                />
              </div>

              {/* Incluir Resumo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir Resumo</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir resumo de atividades nos e-mails
                  </p>
                </div>
                <Switch
                  checked={configuracao.incluirResumo}
                  onCheckedChange={(checked) => atualizarConfiguracao('incluirResumo', checked)}
                  disabled={readonly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Tipos de Notificação */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Tipos de Notificação
              </CardTitle>
              <CardDescription>
                Escolha quais tipos de notificação você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tiposNotificacao.map(({ tipo, label, descricao, icone: Icone }) => {
                const ativo = configuracao.tiposHabilitados.includes(tipo);
                
                return (
                  <div key={tipo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icone className={`h-5 w-5 ${ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{descricao}</p>
                      </div>
                    </div>
                    <Switch
                      checked={ativo}
                      onCheckedChange={() => alternarTipoNotificacao(tipo)}
                      disabled={readonly}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Horários */}
        <TabsContent value="horarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configurações de Horário
              </CardTitle>
              <CardDescription>
                Configure quando e com que antecedência receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Horário Preferido */}
              <div className="space-y-2">
                <Label htmlFor="horario-preferido">Horário Preferido</Label>
                <Input
                  id="horario-preferido"
                  type="time"
                  value={configuracao.horarioPreferido}
                  onChange={(e) => atualizarConfiguracao('horarioPreferido', e.target.value)}
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground">
                  Horário preferido para receber notificações diárias
                </p>
              </div>

              {/* Dias de Antecedência */}
              <div className="space-y-2">
                <Label htmlFor="dias-antecedencia">Dias de Antecedência</Label>
                <Input
                  id="dias-antecedencia"
                  type="number"
                  min="1"
                  max="30"
                  value={configuracao.diasAntecedencia}
                  onChange={(e) => atualizarConfiguracao('diasAntecedencia', parseInt(e.target.value) || 3)}
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground">
                  Quantos dias antes do prazo você deseja ser notificado
                </p>
              </div>

              {/* Assinatura */}
              <div className="space-y-2">
                <Label htmlFor="assinatura">Assinatura Personalizada</Label>
                <Textarea
                  id="assinatura"
                  value={configuracao.assinatura || ''}
                  onChange={(e) => atualizarConfiguracao('assinatura', e.target.value)}
                  placeholder="Sua assinatura personalizada..."
                  rows={3}
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground">
                  Assinatura que será incluída no final dos e-mails (opcional)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Estatísticas de E-mail
              </CardTitle>
              <CardDescription>
                Acompanhe o histórico de envios de e-mail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{estatisticasGerais.totalEnviados}</p>
                  <p className="text-sm text-muted-foreground">Total Enviados</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{estatisticasGerais.sucessos}</p>
                  <p className="text-sm text-muted-foreground">Sucessos</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold">{estatisticasGerais.falhas}</p>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                </div>
              </div>
              
              {estatisticasGerais.totalEnviados > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Taxa de Sucesso</span>
                    <span className="text-sm font-bold">
                      {estatisticasGerais.taxaSucesso.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${estatisticasGerais.taxaSucesso}%` }}
                    />
                  </div>
                </div>
              )}
              
              {estatisticasGerais.ultimoEnvio && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Último envio: {estatisticasGerais.ultimoEnvio.toLocaleString('pt-BR')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas */}
      {!configuracao.emailAtivo && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            As notificações por e-mail estão desativadas. Você não receberá nenhuma notificação.
          </AlertDescription>
        </Alert>
      )}
      
      {configuracao.tiposHabilitados.length === 0 && configuracao.emailAtivo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhum tipo de notificação está habilitado. Configure pelo menos um tipo para receber e-mails.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default ConfiguracaoEmail;