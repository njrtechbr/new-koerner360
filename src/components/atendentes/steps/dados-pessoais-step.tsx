'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

export function DadosPessoaisStep() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const formatarCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatarTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatarCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <User className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Dados Pessoais</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome Completo */}
        <div className="md:col-span-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Digite o nome completo"
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && (
            <p className="text-sm text-red-500 mt-1">
              {errors.nome.message as string}
            </p>
          )}
        </div>

        {/* CPF */}
        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            {...register('cpf', {
              onChange: e => {
                e.target.value = formatarCPF(e.target.value);
              },
            })}
            placeholder="000.000.000-00"
            maxLength={14}
            className={errors.cpf ? 'border-red-500' : ''}
          />
          {errors.cpf && (
            <p className="text-sm text-red-500 mt-1">
              {errors.cpf.message as string}
            </p>
          )}
        </div>

        {/* Data de Nascimento */}
        <div>
          <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
          <Input
            id="dataNascimento"
            type="date"
            {...register('dataNascimento')}
            className={errors.dataNascimento ? 'border-red-500' : ''}
          />
          {errors.dataNascimento && (
            <p className="text-sm text-red-500 mt-1">
              {errors.dataNascimento.message as string}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
              className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {errors.email.message as string}
            </p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="telefone"
              {...register('telefone', {
                onChange: e => {
                  e.target.value = formatarTelefone(e.target.value);
                },
              })}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`pl-10 ${errors.telefone ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.telefone && (
            <p className="text-sm text-red-500 mt-1">
              {errors.telefone.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <MapPin className="w-4 h-4" />
            <span>Endereço</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CEP */}
            <div>
              <Label htmlFor="endereco.cep">CEP *</Label>
              <Input
                id="endereco.cep"
                {...register('endereco.cep', {
                  onChange: e => {
                    e.target.value = formatarCEP(e.target.value);
                  },
                })}
                placeholder="00000-000"
                maxLength={9}
                className={errors.endereco?.cep ? 'border-red-500' : ''}
              />
              {errors.endereco?.cep && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.cep.message as string}
                </p>
              )}
            </div>

            {/* Cidade */}
            <div>
              <Label htmlFor="endereco.cidade">Cidade *</Label>
              <Input
                id="endereco.cidade"
                {...register('endereco.cidade')}
                placeholder="Nome da cidade"
                className={errors.endereco?.cidade ? 'border-red-500' : ''}
              />
              {errors.endereco?.cidade && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.cidade.message as string}
                </p>
              )}
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="endereco.estado">Estado *</Label>
              <Input
                id="endereco.estado"
                {...register('endereco.estado')}
                placeholder="UF"
                maxLength={2}
                className={errors.endereco?.estado ? 'border-red-500' : ''}
              />
              {errors.endereco?.estado && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.estado.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Logradouro */}
            <div className="md:col-span-3">
              <Label htmlFor="endereco.logradouro">Logradouro *</Label>
              <Input
                id="endereco.logradouro"
                {...register('endereco.logradouro')}
                placeholder="Rua, Avenida, etc."
                className={errors.endereco?.logradouro ? 'border-red-500' : ''}
              />
              {errors.endereco?.logradouro && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.logradouro.message as string}
                </p>
              )}
            </div>

            {/* Número */}
            <div>
              <Label htmlFor="endereco.numero">Número *</Label>
              <Input
                id="endereco.numero"
                {...register('endereco.numero')}
                placeholder="123"
                className={errors.endereco?.numero ? 'border-red-500' : ''}
              />
              {errors.endereco?.numero && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.numero.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Complemento */}
            <div>
              <Label htmlFor="endereco.complemento">Complemento</Label>
              <Input
                id="endereco.complemento"
                {...register('endereco.complemento')}
                placeholder="Apartamento, sala, etc."
              />
            </div>

            {/* Bairro */}
            <div>
              <Label htmlFor="endereco.bairro">Bairro *</Label>
              <Input
                id="endereco.bairro"
                {...register('endereco.bairro')}
                placeholder="Nome do bairro"
                className={errors.endereco?.bairro ? 'border-red-500' : ''}
              />
              {errors.endereco?.bairro && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.bairro.message as string}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DadosPessoaisStep;
