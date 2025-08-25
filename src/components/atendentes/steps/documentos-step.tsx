'use client';

import React, { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Upload,
  X,
  Eye,
  Download,
  Camera,
  User,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UploadDocumentos } from '@/components/upload';
import type { ArquivoUpload } from '@/types/documentos';

const tiposDocumento = [
  { value: 'RG', label: 'RG - Registro Geral' },
  { value: 'CPF', label: 'CPF - Cadastro de Pessoa Física' },
  { value: 'CNH', label: 'CNH - Carteira Nacional de Habilitação' },
  { value: 'CTPS', label: 'CTPS - Carteira de Trabalho' },
  { value: 'TITULO_ELEITOR', label: 'Título de Eleitor' },
  { value: 'CERTIFICADO_RESERVISTA', label: 'Certificado de Reservista' },
  { value: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência' },
  { value: 'DIPLOMA', label: 'Diploma/Certificado' },
  { value: 'OUTROS', label: 'Outros' },
];

interface DocumentoUpload {
  id: string;
  tipo: string;
  nome: string;
  arquivo: File;
  preview?: string;
  status: 'pendente' | 'enviando' | 'sucesso' | 'erro';
}

export function DocumentosStep() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const [fotoAtendente, setFotoAtendente] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoUpload[]>([]);
  const [tipoDocumentoSelecionado, setTipoDocumentoSelecionado] = useState('');
  const [arquivosUpload, setArquivosUpload] = useState<ArquivoUpload[]>([]);

  const inputFotoRef = useRef<HTMLInputElement>(null);
  const inputDocumentoRef = useRef<HTMLInputElement>(null);

  const handleFotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    // Validar tipo de arquivo
    if (!arquivo.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    setFotoAtendente(arquivo);
    setValue('foto', arquivo);

    // Criar preview
    const reader = new FileReader();
    reader.onload = e => {
      setPreviewFoto(e.target?.result as string);
    };
    reader.readAsDataURL(arquivo);
  };

  const handleDocumentoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const arquivos = Array.from(event.target.files || []);
    if (arquivos.length === 0 || !tipoDocumentoSelecionado) return;

    arquivos.forEach(arquivo => {
      // Validar tipo de arquivo
      const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ];
      if (!tiposPermitidos.includes(arquivo.type)) {
        toast.error(
          `Arquivo ${arquivo.name}: Tipo não permitido. Use PDF, JPG ou PNG.`
        );
        return;
      }

      // Validar tamanho (máximo 10MB)
      if (arquivo.size > 10 * 1024 * 1024) {
        toast.error(
          `Arquivo ${arquivo.name}: Tamanho máximo de 10MB excedido.`
        );
        return;
      }

      const novoDocumento: DocumentoUpload = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        tipo: tipoDocumentoSelecionado,
        nome: arquivo.name,
        arquivo,
        status: 'pendente',
      };

      // Criar preview para imagens
      if (arquivo.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          novoDocumento.preview = e.target?.result as string;
          setDocumentos(prev => [...prev, novoDocumento]);
        };
        reader.readAsDataURL(arquivo);
      } else {
        setDocumentos(prev => [...prev, novoDocumento]);
      }
    });

    // Limpar seleção
    setTipoDocumentoSelecionado('');
    if (inputDocumentoRef.current) {
      inputDocumentoRef.current.value = '';
    }
  };

  const removerDocumento = (id: string) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
  };

  /**
   * Manipula conclusão do upload
   */
  const handleUploadCompleto = (arquivos: ArquivoUpload[]) => {
    setArquivosUpload(arquivos);
    toast.success(`${arquivos.length} arquivo(s) enviado(s) com sucesso!`);
  };

  /**
   * Manipula erros de upload
   */
  const handleErroUpload = (erro: string) => {
    toast.error(erro);
  };

  const removerFoto = () => {
    setFotoAtendente(null);
    setPreviewFoto(null);
    setValue('foto', null);
    if (inputFotoRef.current) {
      inputFotoRef.current.value = '';
    }
  };

  const formatarTamanhoArquivo = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIconeStatus = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'enviando':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Documentos e Foto</h3>
      </div>

      {/* Upload de Foto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base">
            <Camera className="w-4 h-4" />
            <span>Foto do Atendente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Preview da foto */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden">
                {previewFoto ? (
                  <img
                    src={previewFoto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Controles de upload */}
            <div className="flex-1 space-y-4">
              <div>
                <Label>Foto do Atendente</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputFotoRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {fotoAtendente ? 'Alterar Foto' : 'Selecionar Foto'}
                  </Button>
                  {fotoAtendente && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removerFoto}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoUpload}
                  className="hidden"
                />
                {fotoAtendente && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Arquivo: {fotoAtendente.name} (
                    {formatarTamanhoArquivo(fotoAtendente.size)})
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Documentos */}
      <UploadDocumentos
        onUploadCompleto={handleUploadCompleto}
        onErro={handleErroUpload}
        maxArquivos={10}
        permitirFotos={true}
      />
    </div>
  );
}

export default DocumentosStep;
