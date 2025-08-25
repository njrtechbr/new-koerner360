'use client';

import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interface para filtros de período
 */
export interface FiltrosPeriodo {
  dataInicio?: string;
  dataFim?: string;
  periodo?:
    | 'hoje'
    | '7dias'
    | '30dias'
    | '90dias'
    | '6meses'
    | '1ano'
    | 'personalizado';
  setor?: string;
  cargo?: string;
  status?: 'ativo' | 'inativo' | 'pendente' | 'suspenso';
}

/**
 * Props do componente
 */
interface FiltrosPeriodoProps {
  filtros: FiltrosPeriodo;
  onFiltrosChange: (filtros: FiltrosPeriodo) => void;
  setores?: Array<{ id: string; nome: string }>;
  cargos?: Array<{ id: string; nome: string }>;
  compacto?: boolean;
  mostrarFiltrosAvancados?: boolean;
  className?: string;
}

/**
 * Períodos predefinidos
 */
const PERIODOS_PREDEFINIDOS = [
  { valor: 'hoje', label: 'Hoje', descricao: 'Apenas hoje' },
  { valor: '7dias', label: 'Últimos 7 dias', descricao: 'Uma semana' },
  { valor: '30dias', label: 'Últimos 30 dias', descricao: 'Um mês' },
  { valor: '90dias', label: 'Últimos 90 dias', descricao: 'Três meses' },
  { valor: '6meses', label: 'Últimos 6 meses', descricao: 'Semestre' },
  { valor: '1ano', label: 'Último ano', descricao: 'Doze meses' },
  {
    valor: 'personalizado',
    label: 'Período personalizado',
    descricao: 'Escolher datas',
  },
] as const;

/**
 * Status disponíveis
 */
const STATUS_OPCOES = [
  { valor: 'ativo', label: 'Ativo', cor: 'bg-green-100 text-green-800' },
  { valor: 'inativo', label: 'Inativo', cor: 'bg-red-100 text-red-800' },
  {
    valor: 'pendente',
    label: 'Pendente',
    cor: 'bg-yellow-100 text-yellow-800',
  },
  { valor: 'suspenso', label: 'Suspenso', cor: 'bg-gray-100 text-gray-800' },
] as const;

/**
 * Função para calcular datas baseadas no período
 */
function calcularDatasPeriodo(periodo: string): {
  dataInicio: string;
  dataFim: string;
} {
  const hoje = new Date();
  const dataFim = hoje.toISOString().split('T')[0];

  let dataInicio: string;

  switch (periodo) {
    case 'hoje':
      dataInicio = dataFim;
      break;
    case '7dias':
      dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      break;
    case '30dias':
      dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      break;
    case '90dias':
      dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      break;
    case '6meses':
      dataInicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 6,
        hoje.getDate()
      )
        .toISOString()
        .split('T')[0];
      break;
    case '1ano':
      dataInicio = new Date(
        hoje.getFullYear() - 1,
        hoje.getMonth(),
        hoje.getDate()
      )
        .toISOString()
        .split('T')[0];
      break;
    default:
      dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
  }

  return { dataInicio, dataFim };
}

/**
 * Componente principal de filtros por período
 */
export function FiltrosPeriodo({
  filtros,
  onFiltrosChange,
  setores = [],
  cargos = [],
  compacto = false,
  mostrarFiltrosAvancados = true,
  className,
}: FiltrosPeriodoProps) {
  const [mostrarAvancados, setMostrarAvancados] = useState(false);

  // Função para atualizar período predefinido
  const handlePeriodoChange = (periodo: string) => {
    if (periodo === 'personalizado') {
      onFiltrosChange({
        ...filtros,
        periodo: 'personalizado',
        dataInicio: filtros.dataInicio || '',
        dataFim: filtros.dataFim || '',
      });
    } else {
      const { dataInicio, dataFim } = calcularDatasPeriodo(periodo);
      onFiltrosChange({
        ...filtros,
        periodo: periodo as any,
        dataInicio,
        dataFim,
      });
    }
  };

  // Função para atualizar data específica
  const handleDataChange = (campo: 'dataInicio' | 'dataFim', valor: string) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor,
      periodo: 'personalizado',
    });
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    const { dataInicio, dataFim } = calcularDatasPeriodo('30dias');
    onFiltrosChange({
      dataInicio,
      dataFim,
      periodo: '30dias',
    });
    setMostrarAvancados(false);
  };

  // Contar filtros ativos
  const filtrosAtivos = Object.entries(filtros).filter(([key, value]) => {
    if (key === 'dataInicio' || key === 'dataFim' || key === 'periodo')
      return false;
    return value !== undefined && value !== '';
  }).length;

  if (compacto) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <Select
          value={filtros.periodo || '30dias'}
          onValueChange={handlePeriodoChange}
        >
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS_PREDEFINIDOS.map(periodo => (
              <SelectItem key={periodo.valor} value={periodo.valor}>
                <div>
                  <div className="font-medium">{periodo.label}</div>
                  <div className="text-xs text-gray-500">
                    {periodo.descricao}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtros.periodo === 'personalizado' && (
          <>
            <Input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={e => handleDataChange('dataInicio', e.target.value)}
              className="w-40"
            />
            <span className="text-gray-500">até</span>
            <Input
              type="date"
              value={filtros.dataFim || ''}
              onChange={e => handleDataChange('dataFim', e.target.value)}
              className="w-40"
            />
          </>
        )}

        {mostrarFiltrosAvancados && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarAvancados(!mostrarAvancados)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            {filtrosAtivos > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {filtrosAtivos}
              </Badge>
            )}
          </Button>
        )}

        {filtrosAtivos > 0 && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <span>Filtros de Período</span>
            </CardTitle>
            <CardDescription>
              Selecione o período e critérios para análise
            </CardDescription>
          </div>
          {filtrosAtivos > 0 && (
            <Button variant="outline" size="sm" onClick={limparFiltros}>
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de período */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Período</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PERIODOS_PREDEFINIDOS.map(periodo => (
              <Button
                key={periodo.valor}
                variant={
                  filtros.periodo === periodo.valor ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handlePeriodoChange(periodo.valor)}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium text-xs">{periodo.label}</div>
                  <div className="text-xs opacity-70">{periodo.descricao}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Datas personalizadas */}
        {filtros.periodo === 'personalizado' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio || ''}
                onChange={e => handleDataChange('dataInicio', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim || ''}
                onChange={e => handleDataChange('dataFim', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Filtros avançados */}
        {mostrarFiltrosAvancados && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Filtros Avançados</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarAvancados(!mostrarAvancados)}
              >
                {mostrarAvancados ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>

            {mostrarAvancados && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                {/* Filtro por setor */}
                {setores.length > 0 && (
                  <div className="space-y-2">
                    <Label>Setor</Label>
                    <Select
                      value={filtros.setor || ''}
                      onValueChange={valor =>
                        onFiltrosChange({
                          ...filtros,
                          setor: valor || undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os setores</SelectItem>
                        {setores.map(setor => (
                          <SelectItem key={setor.id} value={setor.id}>
                            {setor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro por cargo */}
                {cargos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Select
                      value={filtros.cargo || ''}
                      onValueChange={valor =>
                        onFiltrosChange({
                          ...filtros,
                          cargo: valor || undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os cargos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os cargos</SelectItem>
                        {cargos.map(cargo => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro por status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filtros.status || ''}
                    onValueChange={valor =>
                      onFiltrosChange({
                        ...filtros,
                        status: (valor as any) || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      {STATUS_OPCOES.map(status => (
                        <SelectItem key={status.valor} value={status.valor}>
                          <div className="flex items-center space-x-2">
                            <div
                              className={cn('w-2 h-2 rounded-full', status.cor)}
                            />
                            <span>{status.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}

        {/* Resumo dos filtros ativos */}
        {filtrosAtivos > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">
              Filtros Ativos
            </Label>
            <div className="flex flex-wrap gap-2">
              {filtros.setor && (
                <Badge variant="secondary">
                  Setor:{' '}
                  {setores.find(s => s.id === filtros.setor)?.nome ||
                    filtros.setor}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() =>
                      onFiltrosChange({ ...filtros, setor: undefined })
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filtros.cargo && (
                <Badge variant="secondary">
                  Cargo:{' '}
                  {cargos.find(c => c.id === filtros.cargo)?.nome ||
                    filtros.cargo}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() =>
                      onFiltrosChange({ ...filtros, cargo: undefined })
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filtros.status && (
                <Badge variant="secondary">
                  Status:{' '}
                  {STATUS_OPCOES.find(s => s.valor === filtros.status)?.label ||
                    filtros.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() =>
                      onFiltrosChange({ ...filtros, status: undefined })
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FiltrosPeriodo;
