import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { constants } from 'fs';

// Configurações de upload
export const UPLOAD_CONFIG = {
  // Tamanhos máximos em bytes
  MAX_FILE_SIZE: {
    DOCUMENT: 10 * 1024 * 1024, // 10MB para documentos
    IMAGE: 5 * 1024 * 1024, // 5MB para imagens
  },

  // Tipos de arquivo permitidos
  ALLOWED_TYPES: {
    DOCUMENT: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ],
    IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  // Extensões permitidas
  ALLOWED_EXTENSIONS: {
    DOCUMENT: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  // Diretórios de upload
  UPLOAD_DIRS: {
    DOCUMENTS: 'uploads/documentos',
    PHOTOS: 'uploads/fotos',
  },
};

// Tipos
export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

export interface UploadOptions {
  type: 'DOCUMENT' | 'IMAGE';
  subDirectory?: string;
  preserveOriginalName?: boolean;
}

/**
 * Valida se o arquivo atende aos critérios de upload
 */
export function validateFile(
  file: File,
  type: 'DOCUMENT' | 'IMAGE'
): { valid: boolean; error?: string } {
  // Verificar tamanho
  const maxSize = UPLOAD_CONFIG.MAX_FILE_SIZE[type];
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  // Verificar tipo MIME
  const allowedTypes = UPLOAD_CONFIG.ALLOWED_TYPES[type];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`,
    };
  }

  // Verificar extensão
  const extension = getFileExtension(file.name);
  const allowedExtensions = UPLOAD_CONFIG.ALLOWED_EXTENSIONS[type];
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Extensão não permitida. Extensões aceitas: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Obtém a extensão do arquivo
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1
    ? fileName.substring(lastDotIndex).toLowerCase()
    : '';
}

/**
 * Gera um nome único para o arquivo
 */
export function generateUniqueFileName(
  originalName: string,
  preserveOriginal = false
): string {
  if (preserveOriginal) {
    const timestamp = Date.now();
    const extension = getFileExtension(originalName);
    const nameWithoutExt = originalName.substring(
      0,
      originalName.lastIndexOf('.')
    );
    return `${nameWithoutExt}_${timestamp}${extension}`;
  }

  const extension = getFileExtension(originalName);
  const uuid = randomUUID();
  return `${uuid}${extension}`;
}

/**
 * Garante que o diretório existe
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await access(dirPath, constants.F_OK);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Salva um arquivo no sistema de arquivos
 */
export async function saveFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Validar arquivo
    const validation = validateFile(file, options.type);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Determinar diretório de upload
    const baseDir =
      options.type === 'DOCUMENT'
        ? UPLOAD_CONFIG.UPLOAD_DIRS.DOCUMENTS
        : UPLOAD_CONFIG.UPLOAD_DIRS.PHOTOS;

    const uploadDir = options.subDirectory
      ? join(process.cwd(), 'public', baseDir, options.subDirectory)
      : join(process.cwd(), 'public', baseDir);

    // Garantir que o diretório existe
    await ensureDirectoryExists(uploadDir);

    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(
      file.name,
      options.preserveOriginalName
    );

    const filePath = join(uploadDir, fileName);

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar arquivo
    await writeFile(filePath, buffer);

    // Retornar caminho relativo para uso na aplicação
    const relativePath = options.subDirectory
      ? `/${baseDir}/${options.subDirectory}/${fileName}`
      : `/${baseDir}/${fileName}`;

    return {
      success: true,
      filePath: relativePath,
      fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    return {
      success: false,
      error: 'Erro interno ao salvar arquivo',
    };
  }
}

/**
 * Remove um arquivo do sistema de arquivos
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // Construir caminho absoluto
    const absolutePath = join(process.cwd(), 'public', filePath);

    // Verificar se o arquivo existe
    await access(absolutePath, constants.F_OK);

    // Remover arquivo
    await unlink(absolutePath);

    return true;
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    return false;
  }
}

/**
 * Verifica se um arquivo existe
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const absolutePath = join(process.cwd(), 'public', filePath);
    await access(absolutePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém informações sobre um arquivo
 */
export async function getFileInfo(filePath: string): Promise<{
  exists: boolean;
  size?: number;
  extension?: string;
  mimeType?: string;
}> {
  try {
    const absolutePath = join(process.cwd(), 'public', filePath);
    await access(absolutePath, constants.F_OK);

    const stats = await import('fs/promises').then(fs => fs.stat(absolutePath));
    const extension = getFileExtension(filePath);

    // Determinar tipo MIME baseado na extensão
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    return {
      exists: true,
      size: stats.size,
      extension,
      mimeType: mimeTypes[extension] || 'application/octet-stream',
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Limpa arquivos antigos (opcional - para manutenção)
 */
export async function cleanupOldFiles(
  directory: string,
  maxAgeInDays: number = 30
): Promise<number> {
  try {
    const { readdir, stat } = await import('fs/promises');
    const absoluteDir = join(process.cwd(), 'public', directory);

    const files = await readdir(absoluteDir);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // em millisegundos

    let deletedCount = 0;

    for (const file of files) {
      const filePath = join(absoluteDir, file);
      const stats = await stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        const relativePath = `/${directory}/${file}`;
        if (await deleteFile(relativePath)) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Erro ao limpar arquivos antigos:', error);
    return 0;
  }
}

/**
 * Utilitário para converter tamanho em bytes para formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utilitário para validar múltiplos arquivos
 */
export function validateMultipleFiles(
  files: File[],
  type: 'DOCUMENT' | 'IMAGE'
): { valid: boolean; errors: string[]; validFiles: File[] } {
  const errors: string[] = [];
  const validFiles: File[] = [];

  files.forEach((file, index) => {
    const validation = validateFile(file, type);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(`Arquivo ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    validFiles,
  };
}
