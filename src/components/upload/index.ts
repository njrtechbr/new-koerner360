/**
 * Exportações do módulo de upload
 */

export { UploadDocumentos } from './upload-documentos';

// Re-exportar tipos centralizados
export type {
  ArquivoUpload,
  ConfiguracaoUpload,
  UploadDocumentosProps,
} from '@/types/documentos';

// Re-exportar utilitários de upload
export {
  validateFile,
  saveFile,
  deleteFile,
  getFileInfo,
  fileExists,
  formatFileSize,
  UPLOAD_CONFIG,
} from '@/lib/upload';
