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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Users,
  Clock,
  Globe,
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConfiguracaoSistema {
  id: string;
  categoria: 'geral' | 'notificacoes' | 'seguranca' | 'email' | 'backup';
  nome: string;
  descricao: string;
  valor: string | boolean | number;
  tipo: 'texto' | 'numero' | 'boolean' | 'select' | 'textarea';
  opcoes?: string[];
  obrigatorio: boolean;
  ativo: boolean;
}

const mockConfiguracoes: ConfiguracaoSistema[] = [
  // Configurações Gerais
  {
    id: 'nome_empresa',
    categoria: 'geral',
    nome: 'Nome da Empresa',
    descricao: 'Nome oficial da empresa exibido no sistema',
    valor: 'Koerner 360',
    tipo: 'texto',
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'timezone',
    categoria: 'geral',
    nome: 'Fuso Horário',
    descricao: 'Fuso horário padrão do sistema',
    valor: 'America/Sao_Paulo',
    tipo: 'select',
    opcoes: [
      'America/Sao_Paulo',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
    ],
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'idioma_padrao',
    categoria: 'geral',
    nome: 'Idioma Padrão',
    descricao: 'Idioma padrão da interface do sistema',
    valor: 'pt-BR',
    tipo: 'select',
    opcoes: ['pt-BR', 'en-US', 'es-ES'],
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'manutencao',
    categoria: 'geral',
    nome: 'Modo Manutenção',
    descricao: 'Ativar modo de manutenção do sistema',
    valor: false,
    tipo: 'boolean',
    obrigatorio: false,
    ativo: true,
  },

  // Configurações de Notificações
  {
    id: 'notif_email',
    categoria: 'notificacoes',
    nome: 'Notificações por Email',
    descricao: 'Enviar notificações por email',
    valor: true,
    tipo: 'boolean',
    obrigatorio: false,
    ativo: true,
  },
  {
    id: 'notif_push',
    categoria: 'notificacoes',
    nome: 'Notificações Push',
    descricao: 'Enviar notificações push no navegador',
    valor: true,
    tipo: 'boolean',
    obrigatorio: false,
    ativo: true,
  },
  {
    id: 'notif_frequencia',
    categoria: 'notificacoes',
    nome: 'Frequência de Notificações',
    descricao: 'Frequência de envio de notificações em lote',
    valor: 'diaria',
    tipo: 'select',
    opcoes: ['imediata', 'horaria', 'diaria', 'semanal'],
    obrigatorio: true,
    ativo: true,
  },

  // Configurações de Segurança
  {
    id: 'sessao_timeout',
    categoria: 'seguranca',
    nome: 'Timeout de Sessão (minutos)',
    descricao: 'Tempo limite para expirar sessões inativas',
    valor: 30,
    tipo: 'numero',
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'senha_complexidade',
    categoria: 'seguranca',
    nome: 'Exigir Senha Complexa',
    descricao: 'Exigir senhas com caracteres especiais e números',
    valor: true,
    tipo: 'boolean',
    obrigatorio: false,
    ativo: true,
  },
  {
    id: 'tentativas_login',
    categoria: 'seguranca',
    nome: 'Máximo de Tentativas de Login',
    descricao: 'Número máximo de tentativas de login antes do bloqueio',
    valor: 5,
    tipo: 'numero',
    obrigatorio: true,
    ativo: true,
  },

  // Configurações de Email
  {
    id: 'smtp_host',
    categoria: 'email',
    nome: 'Servidor SMTP',
    descricao: 'Endereço do servidor SMTP para envio de emails',
    valor: 'smtp.gmail.com',
    tipo: 'texto',
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'smtp_porta',
    categoria: 'email',
    nome: 'Porta SMTP',
    descricao: 'Porta do servidor SMTP',
    valor: 587,
    tipo: 'numero',
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'email_remetente',
    categoria: 'email',
    nome: 'Email Remetente',
    descricao: 'Email usado como remetente das mensagens do sistema',
    valor: 'noreply@koerner360.com',
    tipo: 'texto',
    obrigatorio: true,
    ativo: true,
  },

  // Configurações de Backup
  {
    id: 'backup_automatico',
    categoria: 'backup',
    nome: 'Backup Automático',
    descricao: 'Realizar backup automático do banco de dados',
    valor: true,
    tipo: 'boolean',
    obrigatorio: false,
    ativo: true,
  },
  {
    id: 'backup_frequencia',
    categoria: 'backup',
    nome: 'Frequência do Backup',
    descricao: 'Frequência de execução do backup automático',
    valor: 'diario',
    tipo: 'select',
    opcoes: ['diario', 'semanal', 'mensal'],
    obrigatorio: true,
    ativo: true,
  },
  {
    id: 'backup_retencao',
    categoria: 'backup',
    nome: 'Retenção de Backups (dias)',
    descricao: 'Número de dias para manter os backups',
    valor: 30,
    tipo: 'numero',
    obrigatorio: true,
    ativo: true,
  },
];

const categoriaIcons = {
  geral: Globe,
  notificacoes: Bell,
  seguranca: Shield,
  email: Mail,
  backup: Database,
};

const categoriaLabels = {
  geral: 'Configurações Gerais',
  notificacoes: 'Notificações',
  seguranca: 'Segurança',
  email: 'Email',
  backup: 'Backup',
};

export default function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] =
    useState<ConfiguracaoSistema[]>(mockConfiguracoes);
  const [tabAtiva, setTabAtiva] = useState('geral');
  const [alteracoesPendentes, setAlteracoesPendentes] = useState<Set<string>>(
    new Set()
  );
  const [salvando, setSalvando] = useState(false);

  const handleValorChange = (
    id: string,
    novoValor: string | boolean | number
  ) => {
    setConfiguracoes(prev =>
      prev.map(config =>
        config.id === id ? { ...config, valor: novoValor } : config
      )
    );
    setAlteracoesPendentes(prev => new Set([...prev, id]));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAlteracoesPendentes(new Set());
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  };

  const handleReset = () => {
    setConfiguracoes(mockConfiguracoes);
    setAlteracoesPendentes(new Set());
    toast.info('Configurações resetadas para os valores padrão');
  };

  const renderCampoConfiguracao = (config: ConfiguracaoSistema) => {
    const temAlteracao = alteracoesPendentes.has(config.id);

    return (
      <div
        key={config.id}
        className="space-y-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor={config.id} className="font-medium">
                {config.nome}
              </Label>
              {config.obrigatorio && (
                <Badge variant="destructive" className="text-xs">
                  Obrigatório
                </Badge>
              )}
              {temAlteracao && (
                <Badge variant="outline" className="text-xs">
                  Alterado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{config.descricao}</p>
          </div>
        </div>

        <div className="space-y-2">
          {config.tipo === 'texto' && (
            <Input
              id={config.id}
              value={config.valor as string}
              onChange={e => handleValorChange(config.id, e.target.value)}
              disabled={!config.ativo}
            />
          )}

          {config.tipo === 'numero' && (
            <Input
              id={config.id}
              type="number"
              value={config.valor as number}
              onChange={e =>
                handleValorChange(config.id, parseInt(e.target.value) || 0)
              }
              disabled={!config.ativo}
            />
          )}

          {config.tipo === 'textarea' && (
            <Textarea
              id={config.id}
              value={config.valor as string}
              onChange={e => handleValorChange(config.id, e.target.value)}
              disabled={!config.ativo}
              rows={3}
            />
          )}

          {config.tipo === 'boolean' && (
            <div className="flex items-center space-x-2">
              <Switch
                id={config.id}
                checked={config.valor as boolean}
                onCheckedChange={checked =>
                  handleValorChange(config.id, checked)
                }
                disabled={!config.ativo}
              />
              <Label htmlFor={config.id} className="text-sm">
                {config.valor ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          )}

          {config.tipo === 'select' && config.opcoes && (
            <Select
              value={config.valor as string}
              onValueChange={value => handleValorChange(config.id, value)}
              disabled={!config.ativo}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.opcoes.map(opcao => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  };

  const configuracoesPorCategoria = configuracoes.reduce(
    (acc, config) => {
      if (!acc[config.categoria]) {
        acc[config.categoria] = [];
      }
      acc[config.categoria].push(config);
      return acc;
    },
    {} as Record<string, ConfiguracaoSistema[]>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground">
            Gerencie as configurações globais do sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alteracoesPendentes.size > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {alteracoesPendentes.size} alteração(ões) pendente(s)
            </Badge>
          )}

          <Button
            variant="outline"
            onClick={handleReset}
            disabled={salvando || alteracoesPendentes.size === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>

          <Button
            onClick={handleSalvar}
            disabled={salvando || alteracoesPendentes.size === 0}
          >
            {salvando ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(categoriaLabels).map(([categoria, label]) => {
            const Icon =
              categoriaIcons[categoria as keyof typeof categoriaIcons];
            const temAlteracoes = configuracoesPorCategoria[categoria]?.some(
              config => alteracoesPendentes.has(config.id)
            );

            return (
              <TabsTrigger
                key={categoria}
                value={categoria}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
                {temAlteracoes && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(configuracoesPorCategoria).map(
          ([categoria, configs]) => {
            const Icon =
              categoriaIcons[categoria as keyof typeof categoriaIcons];

            return (
              <TabsContent
                key={categoria}
                value={categoria}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {
                        categoriaLabels[
                          categoria as keyof typeof categoriaLabels
                        ]
                      }
                    </CardTitle>
                    <CardDescription>
                      Configure as opções relacionadas a{' '}
                      {categoriaLabels[
                        categoria as keyof typeof categoriaLabels
                      ].toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {configs.map(renderCampoConfiguracao)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          }
        )}
      </Tabs>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-muted-foreground">
                Status do Servidor
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">v1.0.0</div>
              <div className="text-sm text-muted-foreground">
                Versão do Sistema
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
