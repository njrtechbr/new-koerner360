'use client';

import React, { useState, useRef, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ArquivoUpload,
  ConfiguracaoUpload,
  UploadDocumentosProps,
} from '@/types/documentos';

/**
 * Tipos de documento permitidos
 */
const TIPOS_DOCUMENTO = [
  { value: 'RG', label: 'RG' },
  { value: 'CPF', label: 'CPF' },
  { value: 'CNH', label: 'CNH' },
  { value: 'CTPS', label: 'Carteira de Trabalho' },
  { value: 'TITULO_ELEITOR', label: 'Título de Eleitor' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

/**
 * Componente para upload de documentos e fotos
 */
export function UploadDocumentos({
  onUploadCompleto,
  onErro,
  className,
  maxArquivos = 10,
  permitirFotos = true,
}: UploadDocumentosProps) {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoUpload | null>(
    null
  );
  const [carregandoConfig, setCarregandoConfig] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Carrega configurações de upload
   */
  const carregarConfiguracoes = useCallback(async () => {
    if (configuracao) return;

    setCarregandoConfig(true);
    try {
      const response = await fetch('/api/upload/documentos');
      if (response.ok) {
        const data = await response.json();
        setConfiguracao(data.configuracao);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setCarregandoConfig(false);
    }
  }, [configuracao]);

  /**
   * Valida arquivo antes do upload
   */
  const validarArquivo = (
    arquivo: File,
    categoria: 'documento' | 'foto'
  ): string | null => {
    if (!configuracao) return 'Configurações não carregadas';

    const config =
      categoria === 'foto'
        ? configuracao.tiposPermitidos.imagem
        : configuracao.tiposPermitidos.documento;
    const maxSize =
      categoria === 'foto'
        ? parseFloat(configuracao.tamanhoMaximo.imagem) * 1024 * 1024
        : parseFloat(configuracao.tamanhoMaximo.documento) * 1024 * 1024;

    if (!config.includes(arquivo.type)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${config.join(', ')}`;
    }

    if (arquivo.size > maxSize) {
      const maxSizeStr =
        categoria === 'foto'
          ? configuracao.tamanhoMaximo.imagem
          : configuracao.tamanhoMaximo.documento;
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeStr}`;
    }

    return null;
  };

  /**
   * Gera preview para imagens
   */
  const gerarPreview = (arquivo: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(arquivo);
    });
  };

  /**
   * Adiciona arquivos para upload
   */
  const adicionarArquivos = async (novosArquivos: FileList) => {
    await carregarConfiguracoes();

    if (arquivos.length + novosArquivos.length > maxArquivos) {
      onErro?.(`Máximo de ${maxArquivos} arquivos permitidos`);
      return;
    }

    const arquivosParaAdicionar: ArquivoUpload[] = [];

    for (let i = 0; i < novosArquivos.length; i++) {
      const arquivo = novosArquivos[i];
      const categoria = arquivo.type.startsWith('image/')
        ? 'foto'
        : 'documento';

      if (categoria === 'foto' && !permitirFotos) {
        onErro?.('Upload de fotos não permitido');
        continue;
      }

      const erro = validarArquivo(arquivo, categoria);
      if (erro) {
        onErro?.(erro);
        continue;
      }

      const arquivoUpload: ArquivoUpload = {
        id: `${Date.now()}-${i}`,
        arquivo,
        categoria,
        progresso: 0,
        status: 'pendente',
      };

      // Gerar preview para imagens
      if (categoria === 'foto') {
        arquivoUpload.preview = await gerarPreview(arquivo);
      }

      arquivosParaAdicionar.push(arquivoUpload);
    }

    setArquivos(prev => [...prev, ...arquivosParaAdicionar]);
  };

  /**
   * Remove arquivo da lista
   */
  const removerArquivo = (id: string) => {
    setArquivos(prev => prev.filter(arquivo => arquivo.id !== id));
  };

  /**
   * Atualiza tipo do documento
   */
  const atualizarTipoDocumento = (id: string, tipo: string) => {
    setArquivos(prev =>
      prev.map(arquivo => (arquivo.id === id ? { ...arquivo, tipo } : arquivo))
    );
  };

  /**
   * Faz upload de um arquivo
   */
  const fazerUploadArquivo = async (arquivo: ArquivoUpload): Promise<void> => {
    const formData = new FormData();
    formData.append('arquivo', arquivo.arquivo);
    formData.append('categoria', arquivo.categoria);

    if (arquivo.tipo) {
      formData.append('tipo', arquivo.tipo);
    }

    try {
      setArquivos(prev =>
        prev.map(a =>
          a.id === arquivo.id ? { ...a, status: 'enviando', progresso: 0 } : a
        )
      );

      const response = await fetch('/api/upload/documentos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro no upload');
      }

      const resultado = await response.json();

      setArquivos(prev =>
        prev.map(a =>
          a.id === arquivo.id
            ? {
                ...a,
                status: 'sucesso',
                progresso: 100,
                url: resultado.arquivo.url,
              }
            : a
        )
      );
    } catch (error) {
      const mensagemErro =
        error instanceof Error ? error.message : 'Erro desconhecido';

      setArquivos(prev =>
        prev.map(a =>
          a.id === arquivo.id
            ? {
                ...a,
                status: 'erro',
                erro: mensagemErro,
              }
            : a
        )
      );

      onErro?.(mensagemErro);
    }
  };

  /**
   * Faz upload de todos os arquivos pendentes
   */
  const fazerUploadTodos = async () => {
    const arquivosPendentes = arquivos.filter(a => a.status === 'pendente');

    for (const arquivo of arquivosPendentes) {
      if (arquivo.categoria === 'documento' && !arquivo.tipo) {
        onErro?.('Selecione o tipo do documento antes de fazer upload');
        return;
      }

      await fazerUploadArquivo(arquivo);
    }

    const arquivosComSucesso = arquivos.filter(a => a.status === 'sucesso');
    if (arquivosComSucesso.length > 0) {
      onUploadCompleto?.(arquivosComSucesso);
    }
  };

  /**
   * Manipula drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      adicionarArquivos(files);
    }
  };

  /**
   * Manipula seleção de arquivos
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      adicionarArquivos(files);
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  /**
   * Renderiza ícone do arquivo
   */
  const renderizarIconeArquivo = (arquivo: ArquivoUpload) => {
    if (arquivo.categoria === 'foto') {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  /**
   * Renderiza status do arquivo
   */
  const renderizarStatusArquivo = (arquivo: ArquivoUpload) => {
    switch (arquivo.status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'enviando':
        return <Badge variant="default">Enviando...</Badge>;
      case 'sucesso':
        return (
          <Badge variant="default" className="bg-green-500">
            Sucesso
          </Badge>
        );
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Documentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de upload */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500">
            {permitirFotos
              ? 'Documentos (PDF, JPG, PNG) e fotos'
              : 'Apenas documentos (PDF, JPG, PNG)'}
          </p>
          {configuracao && (
            <p className="text-xs text-gray-400 mt-2">
              Máximo: {configuracao.tamanhoMaximo.documento} por documento,{' '}
              {configuracao.tamanhoMaximo.imagem} por foto
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={
            configuracao
              ? [
                  ...configuracao.tiposPermitidos.documento,
                  ...(permitirFotos ? configuracao.tiposPermitidos.imagem : []),
                ].join(',')
              : '*'
          }
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Lista de arquivos */}
        {arquivos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Arquivos Selecionados</h3>
              <Button
                onClick={fazerUploadTodos}
                disabled={
                  arquivos.every(a => a.status !== 'pendente') ||
                  carregandoConfig
                }
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Fazer Upload
              </Button>
            </div>

            <div className="space-y-3">
              {arquivos.map(arquivo => (
                <div key={arquivo.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Ícone/Preview */}
                    <div className="flex-shrink-0">
                      {arquivo.preview ? (
                        <img
                          src={arquivo.preview}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        renderizarIconeArquivo(arquivo)
                      )}
                    </div>

                    {/* Informações do arquivo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium truncate">
                          {arquivo.arquivo.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderizarStatusArquivo(arquivo)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerArquivo(arquivo.id)}
                            disabled={arquivo.status === 'enviando'}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">
                        {(arquivo.arquivo.size / 1024 / 1024).toFixed(2)} MB •{' '}
                        {arquivo.categoria}
                      </p>

                      {/* Seleção de tipo para documentos */}
                      {arquivo.categoria === 'documento' &&
                        arquivo.status === 'pendente' && (
                          <div className="mb-2">
                            <Label
                              htmlFor={`tipo-${arquivo.id}`}
                              className="text-xs"
                            >
                              Tipo do Documento
                            </Label>
                            <Select
                              value={arquivo.tipo || ''}
                              onValueChange={valor =>
                                atualizarTipoDocumento(arquivo.id, valor)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_DOCUMENTO.map(tipo => (
                                  <SelectItem
                                    key={tipo.value}
                                    value={tipo.value}
                                  >
                                    {tipo.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                      {/* Barra de progresso */}
                      {arquivo.status === 'enviando' && (
                        <Progress value={arquivo.progresso} className="h-2" />
                      )}

                      {/* Erro */}
                      {arquivo.status === 'erro' && arquivo.erro && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {arquivo.erro}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Ações para arquivos com sucesso */}
                      {arquivo.status === 'sucesso' && arquivo.url && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(arquivo.url, '_blank')}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = arquivo.url!;
                              link.download = arquivo.arquivo.name;
                              link.click();
                            }}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações sobre limites */}
        {configuracao && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Tipos permitidos:</strong>
            </p>
            <p>
              • Documentos:{' '}
              {configuracao.extensoesPermitidas.documento.join(', ')}
            </p>
            {permitirFotos && (
              <p>
                • Fotos: {configuracao.extensoesPermitidas.imagem.join(', ')}
              </p>
            )}
            <p>
              <strong>Tamanhos máximos:</strong>
            </p>
            <p>• Documentos: {configuracao.tamanhoMaximo.documento}</p>
            {permitirFotos && (
              <p>• Fotos: {configuracao.tamanhoMaximo.imagem}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UploadDocumentos;
