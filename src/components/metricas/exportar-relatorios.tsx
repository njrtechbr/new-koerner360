'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Loader2,
  Settings,
  Calendar,
  Users,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltrosPeriodo } from './filtros-periodo';

/**
 * Tipos de exportação disponíveis
 */
export type TipoExportacao = 'pdf' | 'excel' | 'csv' | 'png' | 'jpeg';

/**
 * Interface para configurações de exportação
 */
export interface ConfiguracaoExportacao {
  tipo: TipoExportacao;
  incluirGraficos: boolean;
  incluirTabelas: boolean;
  incluirResumo: boolean;
  incluirDetalhes: boolean;
  nomeArquivo?: string;
  observacoes?: string;
  formatoData?: 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy';
  idioma?: 'pt-BR' | 'en-US';
}

/**
 * Interface para dados a serem exportados
 */
export interface DadosExportacao {
  filtros: FiltrosPeriodo;
  metricas: any;
  graficos?: any[];
  tabelas?: any[];
  resumo?: any;
}

/**
 * Props do componente
 */
interface ExportarRelatoriosProps {
  dados: DadosExportacao;
  onExportar: (configuracao: ConfiguracaoExportacao) => Promise<void>;
  carregando?: boolean;
  className?: string;
}

/**
 * Tipos de exportação com suas configurações
 */
const TIPOS_EXPORTACAO = [
  {
    tipo: 'pdf' as TipoExportacao,
    nome: 'PDF',
    descricao: 'Documento portátil com formatação completa',
    icone: <FileText className="h-4 w-4" />,
    extensao: '.pdf',
    suportaGraficos: true,
    suportaTabelas: true,
    tamanhoEstimado: 'Médio',
  },
  {
    tipo: 'excel' as TipoExportacao,
    nome: 'Excel',
    descricao: 'Planilha com dados estruturados',
    icone: <FileSpreadsheet className="h-4 w-4" />,
    extensao: '.xlsx',
    suportaGraficos: true,
    suportaTabelas: true,
    tamanhoEstimado: 'Pequeno',
  },
  {
    tipo: 'csv' as TipoExportacao,
    nome: 'CSV',
    descricao: 'Dados tabulares simples',
    icone: <FileText className="h-4 w-4" />,
    extensao: '.csv',
    suportaGraficos: false,
    suportaTabelas: true,
    tamanhoEstimado: 'Muito pequeno',
  },
  {
    tipo: 'png' as TipoExportacao,
    nome: 'PNG',
    descricao: 'Imagem dos gráficos',
    icone: <FileImage className="h-4 w-4" />,
    extensao: '.png',
    suportaGraficos: true,
    suportaTabelas: false,
    tamanhoEstimado: 'Médio',
  },
  {
    tipo: 'jpeg' as TipoExportacao,
    nome: 'JPEG',
    descricao: 'Imagem comprimida dos gráficos',
    icone: <FileImage className="h-4 w-4" />,
    extensao: '.jpg',
    suportaGraficos: true,
    suportaTabelas: false,
    tamanhoEstimado: 'Pequeno',
  },
];

/**
 * Componente principal para exportação de relatórios
 */
export function ExportarRelatorios({
  dados,
  onExportar,
  carregando = false,
  className,
}: ExportarRelatoriosProps) {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoExportacao>({
    tipo: 'pdf',
    incluirGraficos: true,
    incluirTabelas: true,
    incluirResumo: true,
    incluirDetalhes: false,
    formatoData: 'dd/mm/yyyy',
    idioma: 'pt-BR',
  });

  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);

  // Obter configurações do tipo selecionado
  const tipoSelecionado = TIPOS_EXPORTACAO.find(
    t => t.tipo === configuracao.tipo
  );

  // Função para atualizar configuração
  const atualizarConfiguracao = (
    campo: keyof ConfiguracaoExportacao,
    valor: any
  ) => {
    setConfiguracao(prev => ({ ...prev, [campo]: valor }));
  };

  // Função para gerar nome do arquivo automaticamente
  const gerarNomeArquivo = () => {
    const agora = new Date();
    const data = agora.toISOString().split('T')[0].replace(/-/g, '');
    const hora = agora.toTimeString().split(':').slice(0, 2).join('');
    return `relatorio-atendentes-${data}-${hora}`;
  };

  // Função para executar exportação
  const handleExportar = async () => {
    const config = {
      ...configuracao,
      nomeArquivo: configuracao.nomeArquivo || gerarNomeArquivo(),
    };

    await onExportar(config);
  };

  // Calcular estimativa de conteúdo
  const estimarConteudo = () => {
    let itens = 0;
    if (configuracao.incluirResumo) itens++;
    if (configuracao.incluirGraficos && tipoSelecionado?.suportaGraficos)
      itens += dados.graficos?.length || 3;
    if (configuracao.incluirTabelas && tipoSelecionado?.suportaTabelas)
      itens += dados.tabelas?.length || 2;
    if (configuracao.incluirDetalhes) itens++;
    return itens;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Exportar Relatório</span>
        </CardTitle>
        <CardDescription>
          Configure e exporte os dados de métricas em diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção do tipo de exportação */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Formato de Exportação</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {TIPOS_EXPORTACAO.map(tipo => (
              <div
                key={tipo.tipo}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/50',
                  configuracao.tipo === tipo.tipo
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200'
                )}
                onClick={() => atualizarConfiguracao('tipo', tipo.tipo)}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {tipo.icone}
                  <span className="font-medium text-sm">{tipo.nome}</span>
                  <Badge variant="outline" className="text-xs">
                    {tipo.extensao}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-1">{tipo.descricao}</p>
                <p className="text-xs text-gray-500">
                  Tamanho: {tipo.tamanhoEstimado}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Configurações de conteúdo */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Conteúdo a Incluir</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirResumo"
                checked={configuracao.incluirResumo}
                onCheckedChange={checked =>
                  atualizarConfiguracao('incluirResumo', checked)
                }
              />
              <Label htmlFor="incluirResumo" className="text-sm">
                Resumo executivo
              </Label>
            </div>

            {tipoSelecionado?.suportaGraficos && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirGraficos"
                  checked={configuracao.incluirGraficos}
                  onCheckedChange={checked =>
                    atualizarConfiguracao('incluirGraficos', checked)
                  }
                />
                <Label htmlFor="incluirGraficos" className="text-sm">
                  Gráficos e visualizações
                </Label>
              </div>
            )}

            {tipoSelecionado?.suportaTabelas && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirTabelas"
                  checked={configuracao.incluirTabelas}
                  onCheckedChange={checked =>
                    atualizarConfiguracao('incluirTabelas', checked)
                  }
                />
                <Label htmlFor="incluirTabelas" className="text-sm">
                  Tabelas de dados
                </Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirDetalhes"
                checked={configuracao.incluirDetalhes}
                onCheckedChange={checked =>
                  atualizarConfiguracao('incluirDetalhes', checked)
                }
              />
              <Label htmlFor="incluirDetalhes" className="text-sm">
                Detalhes individuais
              </Label>
            </div>
          </div>
        </div>

        {/* Configurações avançadas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Configurações Avançadas
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarConfiguracoes(!mostrarConfiguracoes)}
            >
              <Settings className="h-4 w-4 mr-1" />
              {mostrarConfiguracoes ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>

          {mostrarConfiguracoes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="nomeArquivo" className="text-sm">
                  Nome do Arquivo
                </Label>
                <Input
                  id="nomeArquivo"
                  placeholder={gerarNomeArquivo()}
                  value={configuracao.nomeArquivo || ''}
                  onChange={e =>
                    atualizarConfiguracao('nomeArquivo', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Formato de Data</Label>
                <Select
                  value={configuracao.formatoData}
                  onValueChange={valor =>
                    atualizarConfiguracao('formatoData', valor)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="observacoes" className="text-sm">
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações ou comentários ao relatório..."
                  value={configuracao.observacoes || ''}
                  onChange={e =>
                    atualizarConfiguracao('observacoes', e.target.value)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Resumo da exportação */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">
              Resumo da Exportação
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Formato:</span>
              <div className="font-medium">
                {tipoSelecionado?.nome} {tipoSelecionado?.extensao}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Itens:</span>
              <div className="font-medium">{estimarConteudo()} componentes</div>
            </div>
            <div>
              <span className="text-gray-600">Período:</span>
              <div className="font-medium">
                {dados.filtros.dataInicio && dados.filtros.dataFim
                  ? `${dados.filtros.dataInicio} a ${dados.filtros.dataFim}`
                  : dados.filtros.periodo || 'Não definido'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Tamanho:</span>
              <div className="font-medium">
                {tipoSelecionado?.tamanhoEstimado}
              </div>
            </div>
          </div>
        </div>

        {/* Botão de exportação */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setConfiguracao({
                tipo: 'pdf',
                incluirGraficos: true,
                incluirTabelas: true,
                incluirResumo: true,
                incluirDetalhes: false,
                formatoData: 'dd/mm/yyyy',
                idioma: 'pt-BR',
              });
              setMostrarConfiguracoes(false);
            }}
          >
            Redefinir
          </Button>
          <Button
            onClick={handleExportar}
            disabled={
              carregando ||
              (!configuracao.incluirResumo &&
                !configuracao.incluirGraficos &&
                !configuracao.incluirTabelas &&
                !configuracao.incluirDetalhes)
            }
            className="min-w-32"
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExportarRelatorios;
