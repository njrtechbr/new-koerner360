'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadDocumentos } from '@/components/upload';
import type { ArquivoUpload } from '@/components/upload';
import {
  DocumentoAtendente,
  VisualizarDocumentosProps,
  TIPOS_DOCUMENTO_LABELS,
} from '@/types/documentos';

/**
 * Componente para visualizar documentos de um atendente
 */
export function VisualizarDocumentos({
  atendenteId,
  podeEditar = false,
  className,
}: VisualizarDocumentosProps) {
  const [documentos, setDocumentos] = useState<DocumentoAtendente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarUpload, setMostrarUpload] = useState(false);
  const [removendoDocumento, setRemovendoDocumento] = useState<string | null>(
    null
  );

  /**
   * Carrega documentos do atendente
   */
  const carregarDocumentos = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch(`/api/atendentes/${atendenteId}/documentos`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao carregar documentos');
      }

      const data = await response.json();
      setDocumentos(data.documentos || []);
    } catch (error) {
      const mensagemErro =
        error instanceof Error ? error.message : 'Erro desconhecido';
      setErro(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Remove documento
   */
  const removerDocumento = async (documentoId: string) => {
    if (!podeEditar) return;

    try {
      setRemovendoDocumento(documentoId);

      const response = await fetch(
        `/api/atendentes/${atendenteId}/documentos/${documentoId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao remover documento');
      }

      setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
      toast.success('Documento removido com sucesso');
    } catch (error) {
      const mensagemErro =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(mensagemErro);
    } finally {
      setRemovendoDocumento(null);
    }
  };

  /**
   * Manipula conclusão do upload
   */
  const handleUploadCompleto = async (arquivos: ArquivoUpload[]) => {
    // Criar documentos no banco de dados para cada arquivo enviado
    for (const arquivo of arquivos) {
      try {
        const response = await fetch(
          `/api/atendentes/${atendenteId}/documentos`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tipo: arquivo.tipo || 'OUTRO',
              numero: `AUTO-${Date.now()}`,
              urlArquivo: arquivo.url,
              nomeArquivo: arquivo.arquivo.name,
              tamanhoArquivo: arquivo.arquivo.size,
              tipoMime: arquivo.arquivo.type,
              observacoes: `Documento enviado via upload em ${new Date().toLocaleString('pt-BR')}`,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.erro || 'Erro ao salvar documento');
        }
      } catch (error) {
        console.error('Erro ao salvar documento:', error);
        toast.error(`Erro ao salvar ${arquivo.arquivo.name}`);
      }
    }

    // Recarregar lista de documentos
    await carregarDocumentos();
    setMostrarUpload(false);
    toast.success(`${arquivos.length} documento(s) adicionado(s) com sucesso!`);
  };

  /**
   * Manipula erros de upload
   */
  const handleErroUpload = (erro: string) => {
    toast.error(erro);
  };

  /**
   * Formata tamanho do arquivo
   */
  const formatarTamanhoArquivo = (bytes?: number): string => {
    if (!bytes) return 'Tamanho desconhecido';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  /**
   * Renderiza ícone do documento
   */
  const renderizarIconeDocumento = (documento: DocumentoAtendente) => {
    if (documento.tipoMime?.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  /**
   * Renderiza skeleton de carregamento
   */
  const renderizarSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  // Carregar documentos ao montar o componente
  useEffect(() => {
    carregarDocumentos();
  }, [atendenteId]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDocumentos}
              disabled={carregando}
            >
              <RefreshCw
                className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`}
              />
            </Button>
            {podeEditar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarUpload(!mostrarUpload)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload de novos documentos */}
        {mostrarUpload && podeEditar && (
          <div className="border-t pt-4">
            <UploadDocumentos
              atendenteId={atendenteId}
              onUploadCompleto={handleUploadCompleto}
              onErro={handleErroUpload}
              maxArquivos={5}
              permitirFotos={true}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setMostrarUpload(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* Carregamento */}
        {carregando && renderizarSkeleton()}

        {/* Lista de documentos */}
        {!carregando && !erro && (
          <div className="space-y-4">
            {documentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum documento encontrado</p>
                {podeEditar && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setMostrarUpload(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Documento
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.map(documento => (
                  <div key={documento.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Ícone */}
                      <div className="flex-shrink-0">
                        {renderizarIconeDocumento(documento)}
                      </div>

                      {/* Informações do documento */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {TIPOS_DOCUMENTO_LABELS[documento.tipo] ||
                              documento.tipo}
                          </h4>
                          <Badge variant="secondary">{documento.numero}</Badge>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          {documento.nomeArquivo && (
                            <p>
                              <strong>Arquivo:</strong> {documento.nomeArquivo}
                            </p>
                          )}
                          {documento.tamanhoArquivo && (
                            <p>
                              <strong>Tamanho:</strong>{' '}
                              {formatarTamanhoArquivo(documento.tamanhoArquivo)}
                            </p>
                          )}
                          {documento.dataEmissao && (
                            <p>
                              <strong>Data de Emissão:</strong>{' '}
                              {new Date(
                                documento.dataEmissao
                              ).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {documento.orgaoEmissor && (
                            <p>
                              <strong>Órgão Emissor:</strong>{' '}
                              {documento.orgaoEmissor}
                            </p>
                          )}
                          {documento.observacoes && (
                            <p>
                              <strong>Observações:</strong>{' '}
                              {documento.observacoes}
                            </p>
                          )}
                          <p>
                            <strong>Adicionado em:</strong>{' '}
                            {new Date(documento.criadoEm).toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-3">
                          {documento.urlArquivo && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(documento.urlArquivo, '_blank')
                                }
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Visualizar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = documento.urlArquivo!;
                                  link.download =
                                    documento.nomeArquivo || 'documento';
                                  link.click();
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Baixar
                              </Button>
                            </>
                          )}
                          {podeEditar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removerDocumento(documento.id)}
                              disabled={removendoDocumento === documento.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {removendoDocumento === documento.id
                                ? 'Removendo...'
                                : 'Remover'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documentos obrigatórios */}
        {!mostrarUpload && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Documentos Obrigatórios</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• RG ou CNH (documento com foto)</li>
              <li>• CPF</li>
              <li>• Comprovante de Residência</li>
              <li>• CTPS (para funcionários CLT)</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VisualizarDocumentos;
