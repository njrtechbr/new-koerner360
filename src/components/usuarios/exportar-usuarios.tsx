'use client';

import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

interface FiltrosUsuarios {
  busca?: string;
  perfil?: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  ativo?: boolean;
  ordenarPor?: 'nome' | 'email' | 'criadoEm' | 'atualizadoEm';
  ordem?: 'asc' | 'desc';
}

interface ExportarUsuariosProps {
  filtros: FiltrosUsuarios;
  onSucesso: () => void;
  onCancelar: () => void;
}

type FormatoExportacao = 'csv' | 'xlsx' | 'json';

interface CamposExportacao {
  id: boolean;
  nome: boolean;
  email: boolean;
  perfil: boolean;
  ativo: boolean;
  criadoEm: boolean;
  atualizadoEm: boolean;
}

export function ExportarUsuarios({
  filtros,
  onSucesso,
  onCancelar,
}: ExportarUsuariosProps) {
  const [carregando, setCarregando] = useState(false);
  const [formato, setFormato] = useState<FormatoExportacao>('csv');
  const [incluirFiltros, setIncluirFiltros] = useState(true);
  const [campos, setCampos] = useState<CamposExportacao>({
    id: false,
    nome: true,
    email: true,
    perfil: true,
    ativo: true,
    criadoEm: true,
    atualizadoEm: false,
  });

  // Alternar seleção de campo
  const alternarCampo = (campo: keyof CamposExportacao) => {
    setCampos(prev => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  // Selecionar todos os campos
  const selecionarTodos = () => {
    const todosSelecionados = Object.values(campos).every(Boolean);
    const novoEstado = !todosSelecionados;

    setCampos({
      id: novoEstado,
      nome: novoEstado,
      email: novoEstado,
      perfil: novoEstado,
      ativo: novoEstado,
      criadoEm: novoEstado,
      atualizadoEm: novoEstado,
    });
  };

  // Realizar exportação
  const realizarExportacao = async () => {
    try {
      setCarregando(true);

      // Verificar se pelo menos um campo foi selecionado
      const camposSelecionados = Object.values(campos).some(Boolean);
      if (!camposSelecionados) {
        toast.error('Selecione pelo menos um campo para exportar');
        return;
      }

      // Preparar parâmetros da exportação
      const params = new URLSearchParams({
        formato,
        campos: Object.entries(campos)
          .filter(([_, selecionado]) => selecionado)
          .map(([campo, _]) => campo)
          .join(','),
        ...(incluirFiltros && filtros.busca && { busca: filtros.busca }),
        ...(incluirFiltros && filtros.perfil && { perfil: filtros.perfil }),
        ...(incluirFiltros &&
          filtros.ativo !== undefined && { ativo: filtros.ativo.toString() }),
        ...(incluirFiltros &&
          filtros.ordenarPor && { ordenarPor: filtros.ordenarPor }),
        ...(incluirFiltros && filtros.ordem && { ordem: filtros.ordem }),
      });

      // Fazer requisição para exportação
      const response = await fetch(`/api/usuarios/exportar?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao exportar usuários');
      }

      // Obter o blob do arquivo
      const blob = await response.blob();

      // Criar URL para download
      const url = window.URL.createObjectURL(blob);

      // Criar elemento de link para download
      const link = document.createElement('a');
      link.href = url;

      // Definir nome do arquivo baseado no formato
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[T:]/g, '-');
      const extensoes = {
        csv: 'csv',
        xlsx: 'xlsx',
        json: 'json',
      };

      link.download = `usuarios-${timestamp}.${extensoes[formato]}`;

      // Executar download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL
      window.URL.revokeObjectURL(url);

      toast.success('Exportação realizada com sucesso');
      onSucesso();
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro inesperado na exportação'
      );
    } finally {
      setCarregando(false);
    }
  };

  // Renderizar ícone do formato
  const renderizarIconeFormato = (formato: FormatoExportacao) => {
    switch (formato) {
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formato de exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Formato de Exportação</CardTitle>
          <CardDescription>
            Escolha o formato do arquivo para exportação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formato}
            onValueChange={(value: FormatoExportacao) => setFormato(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Comma Separated Values)
                </div>
              </SelectItem>
              <SelectItem value="xlsx">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (XLSX)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON (JavaScript Object Notation)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Campos para exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Campos para Exportação</CardTitle>
          <CardDescription>
            Selecione quais campos devem ser incluídos na exportação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selecionar-todos"
              checked={Object.values(campos).every(Boolean)}
              onCheckedChange={selecionarTodos}
            />
            <Label htmlFor="selecionar-todos" className="font-medium">
              Selecionar todos os campos
            </Label>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="campo-id"
                checked={campos.id}
                onCheckedChange={() => alternarCampo('id')}
              />
              <Label htmlFor="campo-id">ID</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="campo-nome"
                checked={campos.nome}
                onCheckedChange={() => alternarCampo('nome')}
              />
              <Label htmlFor="campo-nome">Nome</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="campo-email"
                checked={campos.email}
                onCheckedChange={() => alternarCampo('email')}
              />
              <Label htmlFor="campo-email">Email</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="campo-perfil"
                checked={campos.perfil}
                onCheckedChange={() => alternarCampo('perfil')}
              />
              <Label htmlFor="campo-perfil">Perfil</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="campo-ativo"
                checked={campos.ativo}
                onCheckedChange={() => alternarCampo('ativo')}
              />
              <Label htmlFor="campo-ativo">Status</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="campo-criado"
                checked={campos.criadoEm}
                onCheckedChange={() => alternarCampo('criadoEm')}
              />
              <Label htmlFor="campo-criado">Data de Criação</Label>
            </div>

            <div className="flex items-center space-x-2 col-span-2">
              <Checkbox
                id="campo-atualizado"
                checked={campos.atualizadoEm}
                onCheckedChange={() => alternarCampo('atualizadoEm')}
              />
              <Label htmlFor="campo-atualizado">Data de Atualização</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opções de filtro */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Filtro</CardTitle>
          <CardDescription>
            Configure se os filtros atuais devem ser aplicados na exportação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-filtros"
              checked={incluirFiltros}
              onCheckedChange={setIncluirFiltros}
            />
            <Label htmlFor="incluir-filtros">
              Aplicar filtros atuais na exportação
            </Label>
          </div>

          {incluirFiltros && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Filtros que serão aplicados:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {filtros.busca && <li>• Busca: "{filtros.busca}"</li>}
                {filtros.perfil && <li>• Perfil: {filtros.perfil}</li>}
                {filtros.ativo !== undefined && (
                  <li>• Status: {filtros.ativo ? 'Ativo' : 'Inativo'}</li>
                )}
                {filtros.ordenarPor && (
                  <li>
                    • Ordenação: {filtros.ordenarPor} ({filtros.ordem})
                  </li>
                )}
                {!filtros.busca &&
                  !filtros.perfil &&
                  filtros.ativo === undefined &&
                  !filtros.ordenarPor && <li>• Nenhum filtro ativo</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          disabled={carregando}
          className="flex-1 sm:flex-none"
        >
          Cancelar
        </Button>

        <Button
          onClick={realizarExportacao}
          disabled={carregando || !Object.values(campos).some(Boolean)}
          className="flex-1 sm:flex-none"
        >
          {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {renderizarIconeFormato(formato)}
          <span className="ml-2">Exportar Usuários</span>
        </Button>
      </div>
    </div>
  );
}
