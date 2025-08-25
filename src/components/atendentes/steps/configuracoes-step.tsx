'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Settings,
  Shield,
  Clock,
  Users,
  Key,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const niveisAcesso = [
  {
    value: 'BASICO',
    label: 'Básico',
    description: 'Acesso limitado às funcionalidades essenciais',
  },
  {
    value: 'INTERMEDIARIO',
    label: 'Intermediário',
    description: 'Acesso a funcionalidades avançadas',
  },
  {
    value: 'AVANCADO',
    label: 'Avançado',
    description: 'Acesso completo ao sistema',
  },
  {
    value: 'ADMINISTRADOR',
    label: 'Administrador',
    description: 'Controle total do sistema',
  },
];

const horariosTrabalho = [
  { value: 'COMERCIAL', label: 'Comercial (08:00 - 18:00)' },
  { value: 'MANHA', label: 'Manhã (06:00 - 14:00)' },
  { value: 'TARDE', label: 'Tarde (14:00 - 22:00)' },
  { value: 'NOITE', label: 'Noite (22:00 - 06:00)' },
  { value: 'FLEXIVEL', label: 'Flexível' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
];

const permissoes = [
  {
    categoria: 'Atendimento',
    items: [
      {
        id: 'atendimento_criar',
        label: 'Criar atendimentos',
        description: 'Permite iniciar novos atendimentos',
      },
      {
        id: 'atendimento_editar',
        label: 'Editar atendimentos',
        description: 'Permite modificar atendimentos existentes',
      },
      {
        id: 'atendimento_finalizar',
        label: 'Finalizar atendimentos',
        description: 'Permite encerrar atendimentos',
      },
      {
        id: 'atendimento_transferir',
        label: 'Transferir atendimentos',
        description: 'Permite transferir para outros atendentes',
      },
    ],
  },
  {
    categoria: 'Clientes',
    items: [
      {
        id: 'cliente_visualizar',
        label: 'Visualizar clientes',
        description: 'Acesso aos dados dos clientes',
      },
      {
        id: 'cliente_editar',
        label: 'Editar clientes',
        description: 'Permite modificar dados dos clientes',
      },
      {
        id: 'cliente_criar',
        label: 'Criar clientes',
        description: 'Permite cadastrar novos clientes',
      },
      {
        id: 'cliente_historico',
        label: 'Histórico completo',
        description: 'Acesso ao histórico completo do cliente',
      },
    ],
  },
  {
    categoria: 'Relatórios',
    items: [
      {
        id: 'relatorio_proprio',
        label: 'Relatórios próprios',
        description: 'Visualizar apenas seus próprios relatórios',
      },
      {
        id: 'relatorio_equipe',
        label: 'Relatórios da equipe',
        description: 'Visualizar relatórios da equipe',
      },
      {
        id: 'relatorio_geral',
        label: 'Relatórios gerais',
        description: 'Acesso a todos os relatórios',
      },
      {
        id: 'relatorio_exportar',
        label: 'Exportar relatórios',
        description: 'Permite exportar dados dos relatórios',
      },
    ],
  },
  {
    categoria: 'Administração',
    items: [
      {
        id: 'admin_usuarios',
        label: 'Gerenciar usuários',
        description: 'Criar, editar e desativar usuários',
      },
      {
        id: 'admin_configuracoes',
        label: 'Configurações do sistema',
        description: 'Alterar configurações gerais',
      },
      {
        id: 'admin_logs',
        label: 'Logs do sistema',
        description: 'Visualizar logs de auditoria',
      },
      {
        id: 'admin_backup',
        label: 'Backup e restauração',
        description: 'Gerenciar backups do sistema',
      },
    ],
  },
];

export function ConfiguracoesStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const nivelAcessoSelecionado = watch('nivelAcesso');
  const horarioPersonalizado = watch('horarioTrabalho') === 'PERSONALIZADO';
  const permissoesAtivas = watch('permissoes') || [];

  const handlePermissaoChange = (permissaoId: string, checked: boolean) => {
    const permissoesAtuais = permissoesAtivas || [];
    if (checked) {
      setValue('permissoes', [...permissoesAtuais, permissaoId]);
    } else {
      setValue(
        'permissoes',
        permissoesAtuais.filter((p: string) => p !== permissaoId)
      );
    }
  };

  const selecionarTodasPermissoes = (categoria: string) => {
    const permissoesCategoria =
      permissoes
        .find(p => p.categoria === categoria)
        ?.items.map(item => item.id) || [];

    const permissoesAtuais = permissoesAtivas || [];
    const novasPermissoes = [
      ...new Set([...permissoesAtuais, ...permissoesCategoria]),
    ];
    setValue('permissoes', novasPermissoes);
  };

  const desmarcarTodasPermissoes = (categoria: string) => {
    const permissoesCategoria =
      permissoes
        .find(p => p.categoria === categoria)
        ?.items.map(item => item.id) || [];

    const permissoesAtuais = permissoesAtivas || [];
    const novasPermissoes = permissoesAtuais.filter(
      (p: string) => !permissoesCategoria.includes(p)
    );
    setValue('permissoes', novasPermissoes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Configurações de Acesso</h3>
      </div>

      {/* Configurações de Login */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Key className="w-4 h-4" />
            <span>Credenciais de Acesso</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeUsuario">Nome de Usuário *</Label>
              <Input
                id="nomeUsuario"
                {...register('nomeUsuario')}
                placeholder="Ex: joao.silva"
              />
              {errors.nomeUsuario && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.nomeUsuario.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="senhaTemporaria">Senha Temporária *</Label>
              <Input
                id="senhaTemporaria"
                type="password"
                {...register('senhaTemporaria')}
                placeholder="Senha inicial do usuário"
              />
              {errors.senhaTemporaria && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.senhaTemporaria.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="forcarTrocaSenha" {...register('forcarTrocaSenha')} />
            <Label htmlFor="forcarTrocaSenha">
              Forçar troca de senha no primeiro acesso
            </Label>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O usuário receberá as credenciais por email e será solicitado a
              alterar a senha no primeiro acesso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Nível de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Shield className="w-4 h-4" />
            <span>Nível de Acesso</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nivelAcesso">Nível de Acesso *</Label>
            <Select onValueChange={value => setValue('nivelAcesso', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de acesso" />
              </SelectTrigger>
              <SelectContent>
                {niveisAcesso.map(nivel => (
                  <SelectItem key={nivel.value} value={nivel.value}>
                    <div>
                      <div className="font-medium">{nivel.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {nivel.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.nivelAcesso && (
              <p className="text-sm text-red-500 mt-1">
                {errors.nivelAcesso.message as string}
              </p>
            )}
          </div>

          {nivelAcessoSelecionado === 'ADMINISTRADOR' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> O nível Administrador concede acesso
                total ao sistema, incluindo configurações críticas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Horário de Trabalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Clock className="w-4 h-4" />
            <span>Horário de Trabalho</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="horarioTrabalho">Horário de Trabalho</Label>
            <Select onValueChange={value => setValue('horarioTrabalho', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário de trabalho" />
              </SelectTrigger>
              <SelectContent>
                {horariosTrabalho.map(horario => (
                  <SelectItem key={horario.value} value={horario.value}>
                    {horario.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {horarioPersonalizado && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horarioInicio">Horário de Início</Label>
                <Input
                  id="horarioInicio"
                  type="time"
                  {...register('horarioInicio')}
                />
              </div>
              <div>
                <Label htmlFor="horarioFim">Horário de Fim</Label>
                <Input
                  id="horarioFim"
                  type="time"
                  {...register('horarioFim')}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Dias da Semana</Label>
            <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
                (dia, index) => (
                  <div key={dia} className="flex items-center space-x-1">
                    <Checkbox
                      id={`dia-${index}`}
                      {...register(`diasTrabalho.${index}`)}
                    />
                    <Label htmlFor={`dia-${index}`} className="text-sm">
                      {dia}
                    </Label>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissões Específicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Users className="w-4 h-4" />
            <span>Permissões Específicas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {permissoes.map(categoria => {
            const permissoesCategoria = categoria.items.map(item => item.id);
            const todasMarcadas = permissoesCategoria.every(p =>
              permissoesAtivas.includes(p)
            );
            const algumasMarcadas = permissoesCategoria.some(p =>
              permissoesAtivas.includes(p)
            );

            return (
              <div key={categoria.categoria} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{categoria.categoria}</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        selecionarTodasPermissoes(categoria.categoria)
                      }
                      disabled={todasMarcadas}
                    >
                      Marcar Todas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        desmarcarTodasPermissoes(categoria.categoria)
                      }
                      disabled={!algumasMarcadas}
                    >
                      Desmarcar Todas
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoria.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-2 p-3 border rounded-lg"
                    >
                      <Checkbox
                        id={item.id}
                        checked={permissoesAtivas.includes(item.id)}
                        onCheckedChange={checked =>
                          handlePermissaoChange(item.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={item.id}
                          className="font-medium cursor-pointer"
                        >
                          {item.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="observacoesAcesso">
              Observações sobre o Acesso
            </Label>
            <Textarea
              id="observacoesAcesso"
              {...register('observacoesAcesso')}
              placeholder="Informações adicionais sobre as configurações de acesso..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConfiguracoesStep;
