/**
 * Tipos e interfaces para documentos de atendentes
 */

import { TipoDocumento } from '@/lib/validations';

/**
 * Interface para documento do atendente
 */
export interface DocumentoAtendente {
  id: string;
  atendenteId: string;
  tipo: TipoDocumento;
  numero: string;
  dataEmissao?: string;
  orgaoEmissor?: string;
  urlArquivo?: string;
  nomeArquivo?: string;
  tamanhoArquivo?: number;
  tipoMime?: string;
  observacoes?: string;
  versao: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  criadoPorId?: string;
}

/**
 * Interface para criação de documento
 */
export interface CriarDocumento {
  tipo: TipoDocumento;
  numero: string;
  dataEmissao?: string;
  orgaoEmissor?: string;
  urlArquivo?: string;
  nomeArquivo?: string;
  tamanhoArquivo?: number;
  tipoMime?: string;
  observacoes?: string;
}

/**
 * Interface para atualização de documento
 */
export interface AtualizarDocumento {
  numero?: string;
  dataEmissao?: string;
  orgaoEmissor?: string;
  urlArquivo?: string;
  nomeArquivo?: string;
  tamanhoArquivo?: number;
  tipoMime?: string;
  observacoes?: string;
  ativo?: boolean;
}

/**
 * Interface para resposta da API de documentos
 */
export interface RespostaDocumentos {
  documentos: DocumentoAtendente[];
  total: number;
  pagina: number;
  limite: number;
}

/**
 * Interface para resposta da API de documento único
 */
export interface RespostaDocumento {
  documento: DocumentoAtendente;
}

/**
 * Mapeamento de tipos de documento para labels
 */
export const TIPOS_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  RG: 'RG',
  CPF: 'CPF',
  CNH: 'CNH',
  CARTEIRA_TRABALHO: 'Carteira de Trabalho',
  TITULO_ELEITOR: 'Título de Eleitor',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
  DIPLOMA: 'Diploma',
  CERTIFICADO: 'Certificado',
  CONTRATO: 'Contrato',
  OUTROS: 'Outros',
};

/**
 * Status de upload de arquivo
 */
export type StatusUpload = 'pending' | 'uploading' | 'success' | 'error';

/**
 * Interface para arquivo em upload
 */
export interface ArquivoUpload {
  id: string;
  arquivo: File;
  nome: string;
  tamanho: number;
  tipo: string;
  status: StatusUpload;
  progresso: number;
  erro?: string;
  url?: string;
}

/**
 * Interface para configuração de upload
 */
export interface ConfiguracaoUpload {
  maxTamanho: number;
  tiposPermitidos: string[];
  extensoesPermitidas: string[];
  maxArquivos: number;
}

/**
 * Props para componente de upload de documentos
 */
export interface UploadDocumentosProps {
  onUploadCompleto?: (arquivos: ArquivoUpload[]) => void;
  onErro?: (erro: string) => void;
  maxArquivos?: number;
  permitirFotos?: boolean;
  className?: string;
}

/**
 * Props para componente de visualização de documentos
 */
export interface VisualizarDocumentosProps {
  atendenteId: string;
  podeEditar?: boolean;
  className?: string;
}

/**
 * Interface para histórico de alterações de documento
 */
export interface HistoricoDocumento {
  id: string;
  documentoId: string;
  acao: 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO';
  campo?: string;
  valorAnterior?: string;
  valorNovo?: string;
  usuarioId: string;
  criadoEm: string;
}

/**
 * Interface para estatísticas de documentos
 */
export interface EstatisticasDocumentos {
  total: number;
  porTipo: Record<TipoDocumento, number>;
  pendentes: number;
  vencidos: number;
  atualizadosRecentemente: number;
}
