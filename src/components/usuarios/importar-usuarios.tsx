'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Loader2,
} from 'lucide-react';

interface ImportarUsuariosProps {
  onSucesso: (resultado: ResultadoImportacao) => void;
  onCancelar: () => void;
}

interface ResultadoImportacao {
  total: number;
  sucesso: number;
  erros: number;
  detalhes: {
    linha: number;
    erro: string;
    dados?: any;
  }[];
}

interface ConfiguracaoImportacao {
  sobrescreverExistentes: boolean;
  enviarEmailBoasVindas: boolean;
  gerarSenhaTemporaria: boolean;
  ativarUsuarios: boolean;
}

export function ImportarUsuarios({
  onSucesso,
  onCancelar,
}: ImportarUsuariosProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoImportacao>({
    sobrescreverExistentes: false,
    enviarEmailBoasVindas: true,
    gerarSenhaTemporaria: true,
    ativarUsuarios: true,
  });

  const inputArquivoRef = useRef<HTMLInputElement>(null);

  // Manipular seleção de arquivo
  const manipularSelecaoArquivo = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const arquivoSelecionado = event.target.files?.[0];

    if (arquivoSelecionado) {
      // Validar tipo de arquivo
      const tiposPermitidos = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json',
      ];

      if (!tiposPermitidos.includes(arquivoSelecionado.type)) {
        toast.error('Tipo de arquivo não suportado. Use CSV, Excel ou JSON.');
        return;
      }

      // Validar tamanho do arquivo (máximo 10MB)
      const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
      if (arquivoSelecionado.size > tamanhoMaximo) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB.');
        return;
      }

      setArquivo(arquivoSelecionado);
      setResultado(null);
    }
  };

  // Remover arquivo selecionado
  const removerArquivo = () => {
    setArquivo(null);
    setResultado(null);
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = '';
    }
  };

  // Alterar configuração
  const alternarConfiguracao = (chave: keyof ConfiguracaoImportacao) => {
    setConfiguracao(prev => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  };

  // Realizar importação
  const realizarImportacao = async () => {
    if (!arquivo) {
      toast.error('Selecione um arquivo para importar');
      return;
    }

    try {
      setCarregando(true);
      setProgresso(0);

      // Preparar FormData
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('configuracao', JSON.stringify(configuracao));

      // Fazer requisição com acompanhamento de progresso
      const response = await fetch('/api/usuarios/importar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao importar usuários');
      }

      // Simular progresso (em uma implementação real, isso viria do servidor)
      const intervalos = [20, 40, 60, 80, 95, 100];
      for (const valor of intervalos) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgresso(valor);
      }

      const resultadoImportacao: ResultadoImportacao = await response.json();
      setResultado(resultadoImportacao);

      if (resultadoImportacao.erros === 0) {
        toast.success(
          `Importação concluída! ${resultadoImportacao.sucesso} usuários importados.`
        );
      } else {
        toast.warning(
          `Importação concluída com ${resultadoImportacao.erros} erro(s). ${resultadoImportacao.sucesso} usuários importados.`
        );
      }

      onSucesso(resultadoImportacao);
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro inesperado na importação'
      );
    } finally {
      setCarregando(false);
    }
  };

  // Baixar modelo de importação
  const baixarModelo = async () => {
    try {
      const response = await fetch('/api/usuarios/modelo-importacao');

      if (!response.ok) {
        throw new Error('Erro ao baixar modelo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'modelo-importacao-usuarios.csv';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success('Modelo baixado com sucesso');
    } catch (error) {
      console.error('Erro ao baixar modelo:', error);
      toast.error('Erro ao baixar modelo de importação');
    }
  };

  // Renderizar resultado da importação
  const renderizarResultado = () => {
    if (!resultado) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {resultado.erros === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Resultado da Importação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{resultado.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {resultado.sucesso}
              </div>
              <div className="text-sm text-muted-foreground">Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {resultado.erros}
              </div>
              <div className="text-sm text-muted-foreground">Erros</div>
            </div>
          </div>

          {resultado.detalhes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Detalhes dos Erros:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {resultado.detalhes.map((detalhe, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Linha {detalhe.linha}:</strong> {detalhe.erro}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Instruções e modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções de Importação</CardTitle>
          <CardDescription>
            Importe usuários em lote usando arquivos CSV, Excel ou JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos suportados:</strong> CSV, Excel (.xlsx) e JSON
              <br />
              <strong>Tamanho máximo:</strong> 10MB
              <br />
              <strong>Campos obrigatórios:</strong> nome, email
            </AlertDescription>
          </Alert>

          <Button
            type="button"
            variant="outline"
            onClick={baixarModelo}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Modelo de Importação
          </Button>
        </CardContent>
      </Card>

      {/* Seleção de arquivo */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Arquivo</CardTitle>
          <CardDescription>
            Escolha o arquivo contendo os dados dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="arquivo-importacao">Arquivo</Label>
              <Input
                id="arquivo-importacao"
                type="file"
                ref={inputArquivoRef}
                accept=".csv,.xlsx,.xls,.json"
                onChange={manipularSelecaoArquivo}
                disabled={carregando}
              />
            </div>

            {arquivo && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{arquivo.name}</span>
                  <Badge variant="secondary">
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removerArquivo}
                  disabled={carregando}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações de importação */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Importação</CardTitle>
          <CardDescription>
            Configure como os usuários devem ser importados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sobrescrever-existentes"
                checked={configuracao.sobrescreverExistentes}
                onCheckedChange={() =>
                  alternarConfiguracao('sobrescreverExistentes')
                }
                disabled={carregando}
              />
              <Label htmlFor="sobrescrever-existentes">
                Sobrescrever usuários existentes (baseado no email)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enviar-email-boas-vindas"
                checked={configuracao.enviarEmailBoasVindas}
                onCheckedChange={() =>
                  alternarConfiguracao('enviarEmailBoasVindas')
                }
                disabled={carregando}
              />
              <Label htmlFor="enviar-email-boas-vindas">
                Enviar email de boas-vindas para novos usuários
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="gerar-senha-temporaria"
                checked={configuracao.gerarSenhaTemporaria}
                onCheckedChange={() =>
                  alternarConfiguracao('gerarSenhaTemporaria')
                }
                disabled={carregando}
              />
              <Label htmlFor="gerar-senha-temporaria">
                Gerar senha temporária (se não fornecida no arquivo)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativar-usuarios"
                checked={configuracao.ativarUsuarios}
                onCheckedChange={() => alternarConfiguracao('ativarUsuarios')}
                disabled={carregando}
              />
              <Label htmlFor="ativar-usuarios">
                Ativar usuários automaticamente após importação
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso da importação */}
      {carregando && (
        <Card>
          <CardHeader>
            <CardTitle>Importando Usuários</CardTitle>
            <CardDescription>
              Aguarde enquanto os usuários são processados...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progresso} className="w-full" />
              <div className="text-center text-sm text-muted-foreground">
                {progresso}% concluído
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da importação */}
      {renderizarResultado()}

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          disabled={carregando}
          className="flex-1 sm:flex-none"
        >
          {resultado ? 'Fechar' : 'Cancelar'}
        </Button>

        {!resultado && (
          <Button
            onClick={realizarImportacao}
            disabled={carregando || !arquivo}
            className="flex-1 sm:flex-none"
          >
            {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Importar Usuários
          </Button>
        )}
      </div>
    </div>
  );
}
