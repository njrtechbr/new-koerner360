'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  User,
  Briefcase,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  criarAtendenteSchema,
  atualizarAtendenteSchema,
  type CriarAtendenteInput,
  type AtualizarAtendenteInput,
} from '@/lib/validations';
import DadosPessoaisStep from './steps/dados-pessoais-step';
import DadosProfissionaisStep from './steps/dados-profissionais-step';
import DocumentosStep from './steps/documentos-step';
import ConfiguracoesStep from './steps/configuracoes-step';

interface FormularioAtendenteProps {
  atendente?: any; // Dados do atendente para edição
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const etapas = [
  {
    id: 1,
    titulo: 'Dados Pessoais',
    descricao: 'Informações básicas do atendente',
    icone: User,
  },
  {
    id: 2,
    titulo: 'Dados Profissionais',
    descricao: 'Cargo, departamento e informações de trabalho',
    icone: Briefcase,
  },
  {
    id: 3,
    titulo: 'Documentos',
    descricao: 'Upload de documentos e foto',
    icone: FileText,
  },
  {
    id: 4,
    titulo: 'Configurações',
    descricao: 'Acesso e configurações do sistema',
    icone: Settings,
  },
];

export function FormularioAtendente({
  atendente,
  onSubmit,
  onCancel,
  isLoading = false,
}: FormularioAtendenteProps) {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dadosFormulario, setDadosFormulario] = useState<any>({});

  const isEdicao = !!atendente;
  const schema = isEdicao ? atualizarAtendenteSchema : criarAtendenteSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: atendente || {},
    mode: 'onChange',
  });

  const {
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isValid },
  } = methods;

  // Carregar dados salvos do localStorage
  useEffect(() => {
    if (!isEdicao) {
      const dadosSalvos = localStorage.getItem('formulario-atendente-temp');
      if (dadosSalvos) {
        try {
          const dados = JSON.parse(dadosSalvos);
          setDadosFormulario(dados);
          methods.reset(dados);
        } catch (error) {
          console.error('Erro ao carregar dados salvos:', error);
        }
      }
    }
  }, [isEdicao, methods]);

  // Salvar dados no localStorage a cada mudança
  useEffect(() => {
    if (!isEdicao) {
      const subscription = methods.watch(data => {
        localStorage.setItem('formulario-atendente-temp', JSON.stringify(data));
        setDadosFormulario(data);
      });
      return () => subscription.unsubscribe();
    }
  }, [isEdicao, methods]);

  const proximaEtapa = async () => {
    const camposEtapaAtual = getCamposEtapa(etapaAtual);
    const isEtapaValida = await trigger(camposEtapaAtual);

    if (isEtapaValida) {
      setEtapaAtual(prev => Math.min(prev + 1, etapas.length));
    } else {
      toast.error('Por favor, corrija os erros antes de continuar.');
    }
  };

  const etapaAnterior = () => {
    setEtapaAtual(prev => Math.max(prev - 1, 1));
  };

  const onSubmitForm = async (data: any) => {
    try {
      await onSubmit(data);
      // Limpar dados temporários após sucesso
      if (!isEdicao) {
        localStorage.removeItem('formulario-atendente-temp');
      }
      toast.success(
        isEdicao
          ? 'Atendente atualizado com sucesso!'
          : 'Atendente criado com sucesso!'
      );
    } catch (error) {
      toast.error('Erro ao salvar atendente. Tente novamente.');
    }
  };

  const getCamposEtapa = (etapa: number): string[] => {
    switch (etapa) {
      case 1:
        return [
          'nome',
          'cpf',
          'email',
          'telefone',
          'dataNascimento',
          'endereco',
        ];
      case 2:
        return [
          'cargo',
          'departamento',
          'dataAdmissao',
          'salario',
          'tipoContrato',
        ];
      case 3:
        return ['foto', 'documentos'];
      case 4:
        return ['status', 'permissoes', 'observacoes'];
      default:
        return [];
    }
  };

  const renderizarEtapa = () => {
    switch (etapaAtual) {
      case 0:
        return <DadosPessoaisStep />;
      case 1:
        return <DadosProfissionaisStep />;
      case 2:
        return <DocumentosStep />;
      case 3:
        return <ConfiguracoesStep />;
      default:
        return <DadosPessoaisStep />;
    }
  };

  const progresso = (etapaAtual / etapas.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isEdicao ? 'Editar Atendente' : 'Novo Atendente'}
          </CardTitle>

          {/* Indicador de progresso */}
          <div className="space-y-4">
            <Progress value={progresso} className="w-full" />

            {/* Navegação de etapas */}
            <div className="flex justify-between">
              {etapas.map(etapa => {
                const Icone = etapa.icone;
                const isAtiva = etapa.id === etapaAtual;
                const isConcluida = etapa.id < etapaAtual;

                return (
                  <div
                    key={etapa.id}
                    className={`flex flex-col items-center space-y-2 cursor-pointer transition-colors ${
                      isAtiva
                        ? 'text-primary'
                        : isConcluida
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                    }`}
                    onClick={() => setEtapaAtual(etapa.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isAtiva
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isConcluida
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-muted-foreground'
                      }`}
                    >
                      <Icone className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{etapa.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {etapa.descricao}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
              {/* Conteúdo da etapa atual */}
              <div className="min-h-[400px]">{renderizarEtapa()}</div>

              {/* Botões de navegação */}
              <div className="flex justify-between pt-6 border-t">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>

                  {etapaAtual > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={etapaAnterior}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  {etapaAtual < etapas.length ? (
                    <Button type="button" onClick={proximaEtapa}>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading || !isValid}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading
                        ? 'Salvando...'
                        : isEdicao
                          ? 'Atualizar'
                          : 'Criar Atendente'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}

export default FormularioAtendente;
