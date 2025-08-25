'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

const departamentos = [
  'Atendimento',
  'Vendas',
  'Suporte Técnico',
  'Recursos Humanos',
  'Financeiro',
  'Marketing',
  'TI',
  'Operações',
  'Qualidade',
  'Treinamento',
];

const cargos = [
  'Atendente',
  'Atendente Sênior',
  'Supervisor de Atendimento',
  'Coordenador de Atendimento',
  'Gerente de Atendimento',
  'Analista de Suporte',
  'Especialista em Atendimento',
  'Consultor de Vendas',
  'Assistente Administrativo',
  'Trainee',
];

const tiposContrato = [
  { value: 'CLT', label: 'CLT - Consolidação das Leis do Trabalho' },
  { value: 'PJ', label: 'PJ - Pessoa Jurídica' },
  { value: 'ESTAGIO', label: 'Estágio' },
  { value: 'TERCEIRIZADO', label: 'Terceirizado' },
  { value: 'TEMPORARIO', label: 'Temporário' },
];

const turnos = [
  { value: 'MANHA', label: 'Manhã (06:00 - 14:00)' },
  { value: 'TARDE', label: 'Tarde (14:00 - 22:00)' },
  { value: 'NOITE', label: 'Noite (22:00 - 06:00)' },
  { value: 'COMERCIAL', label: 'Comercial (08:00 - 18:00)' },
  { value: 'FLEXIVEL', label: 'Flexível' },
];

export function DadosProfissionaisStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const formatarSalario = (value: string) => {
    const numero = value.replace(/\D/g, '');
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(numero) / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Briefcase className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Dados Profissionais</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cargo */}
        <div>
          <Label htmlFor="cargo">Cargo *</Label>
          <Select onValueChange={value => setValue('cargo', value)}>
            <SelectTrigger className={errors.cargo ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              {cargos.map(cargo => (
                <SelectItem key={cargo} value={cargo}>
                  {cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cargo && (
            <p className="text-sm text-red-500 mt-1">
              {errors.cargo.message as string}
            </p>
          )}
        </div>

        {/* Departamento */}
        <div>
          <Label htmlFor="departamento">Departamento *</Label>
          <Select onValueChange={value => setValue('departamento', value)}>
            <SelectTrigger
              className={errors.departamento ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Selecione o departamento" />
            </SelectTrigger>
            <SelectContent>
              {departamentos.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departamento && (
            <p className="text-sm text-red-500 mt-1">
              {errors.departamento.message as string}
            </p>
          )}
        </div>

        {/* Data de Admissão */}
        <div>
          <Label htmlFor="dataAdmissao">Data de Admissão *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="dataAdmissao"
              type="date"
              {...register('dataAdmissao')}
              className={`pl-10 ${errors.dataAdmissao ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.dataAdmissao && (
            <p className="text-sm text-red-500 mt-1">
              {errors.dataAdmissao.message as string}
            </p>
          )}
        </div>

        {/* Tipo de Contrato */}
        <div>
          <Label htmlFor="tipoContrato">Tipo de Contrato *</Label>
          <Select onValueChange={value => setValue('tipoContrato', value)}>
            <SelectTrigger
              className={errors.tipoContrato ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Selecione o tipo de contrato" />
            </SelectTrigger>
            <SelectContent>
              {tiposContrato.map(tipo => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipoContrato && (
            <p className="text-sm text-red-500 mt-1">
              {errors.tipoContrato.message as string}
            </p>
          )}
        </div>

        {/* Salário */}
        <div>
          <Label htmlFor="salario">Salário *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="salario"
              {...register('salario', {
                onChange: e => {
                  e.target.value = formatarSalario(e.target.value);
                },
              })}
              placeholder="R$ 0,00"
              className={`pl-10 ${errors.salario ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.salario && (
            <p className="text-sm text-red-500 mt-1">
              {errors.salario.message as string}
            </p>
          )}
        </div>

        {/* Turno */}
        <div>
          <Label htmlFor="turno">Turno de Trabalho *</Label>
          <Select onValueChange={value => setValue('turno', value)}>
            <SelectTrigger className={errors.turno ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o turno" />
            </SelectTrigger>
            <SelectContent>
              {turnos.map(turno => (
                <SelectItem key={turno.value} value={turno.value}>
                  {turno.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.turno && (
            <p className="text-sm text-red-500 mt-1">
              {errors.turno.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <FileText className="w-4 h-4" />
            <span>Informações Adicionais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supervisor Direto */}
            <div>
              <Label htmlFor="supervisorDireto">Supervisor Direto</Label>
              <Input
                id="supervisorDireto"
                {...register('supervisorDireto')}
                placeholder="Nome do supervisor"
              />
            </div>

            {/* Ramal */}
            <div>
              <Label htmlFor="ramal">Ramal</Label>
              <Input
                id="ramal"
                {...register('ramal')}
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>

          {/* Centro de Custo */}
          <div>
            <Label htmlFor="centroCusto">Centro de Custo</Label>
            <Input
              id="centroCusto"
              {...register('centroCusto')}
              placeholder="CC-001"
            />
          </div>

          {/* Observações Profissionais */}
          <div>
            <Label htmlFor="observacoesProfissionais">
              Observações Profissionais
            </Label>
            <Textarea
              id="observacoesProfissionais"
              {...register('observacoesProfissionais')}
              placeholder="Informações adicionais sobre o perfil profissional..."
              rows={3}
            />
          </div>

          {/* Competências */}
          <div>
            <Label htmlFor="competencias">Competências e Habilidades</Label>
            <Textarea
              id="competencias"
              {...register('competencias')}
              placeholder="Liste as principais competências e habilidades..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metas e Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Building className="w-4 h-4" />
            <span>Metas e Objetivos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta Mensal */}
            <div>
              <Label htmlFor="metaMensal">Meta Mensal</Label>
              <Input
                id="metaMensal"
                {...register('metaMensal')}
                placeholder="Ex: 100 atendimentos"
              />
            </div>

            {/* Meta Anual */}
            <div>
              <Label htmlFor="metaAnual">Meta Anual</Label>
              <Input
                id="metaAnual"
                {...register('metaAnual')}
                placeholder="Ex: 1200 atendimentos"
              />
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <Label htmlFor="objetivos">
              Objetivos e Plano de Desenvolvimento
            </Label>
            <Textarea
              id="objetivos"
              {...register('objetivos')}
              placeholder="Descreva os objetivos e plano de desenvolvimento profissional..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DadosProfissionaisStep;
