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
    VIDEO: 50 * 1024 * 1024, // 50MB para vídeos
    AUDIO: 20 * 1024 * 1024, // 20MB para áudios
  },

  // Tipos de arquivo permitidos
  ALLOWED_TYPES: {
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    IMAGE: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  },

  // Diretórios de upload
  UPLOAD_DIRS: {
    DOCUMENTS: 'uploads/documents',
    IMAGES: 'uploads/images',
    VIDEOS: 'uploads/videos',
    AUDIOS: 'uploads/audios',
    TEMP: 'uploads/temp',
  },
};

// Tipos de arquivo
export type TipoArquivo = 'DOCUMENT' | 'IMAGE' | 'VIDEO' | 'AUDIO';

// Interface para resultado de upload
export interface ResultadoUpload {
  sucesso: boolean;
  arquivo?: {
    id: string;
    nome: string;
    nomeOriginal: string;
    tamanho: number;
    tipo: string;
    caminho: string;
    url: string;
  };
  erro?: string;
}

// Interface para validação de arquivo
export interface ResultadoValidacao {
  valido: boolean;
  erro?: string;
  tipo?: TipoArquivo;
}

/**
 * Valida um arquivo baseado no tipo e configurações
 */
export function validateFile(
  file: File,
  tipoEsperado?: TipoArquivo
): ResultadoValidacao {
  try {
    // Determinar tipo do arquivo
    let tipo: TipoArquivo;

    if (tipoEsperado) {
      tipo = tipoEsperado;
    } else {
      // Auto-detectar tipo baseado no MIME type
      if (UPLOAD_CONFIG.ALLOWED_TYPES.DOCUMENT.includes(file.type)) {
        tipo = 'DOCUMENT';
      } else if (UPLOAD_CONFIG.ALLOWED_TYPES.IMAGE.includes(file.type)) {
        tipo = 'IMAGE';
      } else if (UPLOAD_CONFIG.ALLOWED_TYPES.VIDEO.includes(file.type)) {
        tipo = 'VIDEO';
      } else if (UPLOAD_CONFIG.ALLOWED_TYPES.AUDIO.includes(file.type)) {
        tipo = 'AUDIO';
      } else {
        return {
          valido: false,
          erro: `Tipo de arquivo não suportado: ${file.type}`,
        };
      }
    }

    // Verificar se o tipo MIME é permitido
    if (!UPLOAD_CONFIG.ALLOWED_TYPES[tipo].includes(file.type)) {
      return {
        valido: false,
        erro: `Tipo de arquivo não permitido para categoria ${tipo}: ${file.type}`,
      };
    }

    // Verificar tamanho do arquivo
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE[tipo]) {
      const maxSizeMB = UPLOAD_CONFIG.MAX_FILE_SIZE[tipo] / (1024 * 1024);
      return {
        valido: false,
        erro: `Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`,
      };
    }

    // Verificar se o arquivo não está vazio
    if (file.size === 0) {
      return {
        valido: false,
        erro: 'Arquivo está vazio',
      };
    }

    return {
      valido: true,
      tipo,
    };
  } catch (error) {
    return {
      valido: false,
      erro: `Erro ao validar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Salva um arquivo no sistema de arquivos
 */
export async function saveFile(
  file: File,
  tipo: TipoArquivo,
  subdiretorio?: string
): Promise<ResultadoUpload> {
  try {
    // Validar arquivo
    const validacao = validateFile(file, tipo);
    if (!validacao.valido) {
      return {
        sucesso: false,
        erro: validacao.erro,
      };
    }

    // Gerar ID único para o arquivo
    const fileId = randomUUID();

    // Obter extensão do arquivo
    const extensao = file.name.split('.').pop() || '';

    // Gerar nome único para o arquivo
    const nomeArquivo = `${fileId}.${extensao}`;

    // Determinar diretório de destino
    let diretorioBase: string;
    switch (tipo) {
      case 'DOCUMENT':
        diretorioBase = UPLOAD_CONFIG.UPLOAD_DIRS.DOCUMENTS;
        break;
      case 'IMAGE':
        diretorioBase = UPLOAD_CONFIG.UPLOAD_DIRS.IMAGES;
        break;
      case 'VIDEO':
        diretorioBase = UPLOAD_CONFIG.UPLOAD_DIRS.VIDEOS;
        break;
      case 'AUDIO':
        diretorioBase = UPLOAD_CONFIG.UPLOAD_DIRS.AUDIOS;
        break;
      default:
        diretorioBase = UPLOAD_CONFIG.UPLOAD_DIRS.TEMP;
    }

    // Adicionar subdiretório se especificado
    const diretorioCompleto = subdiretorio
      ? join(process.cwd(), 'public', diretorioBase, subdiretorio)
      : join(process.cwd(), 'public', diretorioBase);

    // Criar diretório se não existir
    await mkdir(diretorioCompleto, { recursive: true });

    // Caminho completo do arquivo
    const caminhoArquivo = join(diretorioCompleto, nomeArquivo);

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar arquivo
    await writeFile(caminhoArquivo, buffer);

    // Gerar URL pública
    const urlPublica = subdiretorio
      ? `/${diretorioBase}/${subdiretorio}/${nomeArquivo}`
      : `/${diretorioBase}/${nomeArquivo}`;

    return {
      sucesso: true,
      arquivo: {
        id: fileId,
        nome: nomeArquivo,
        nomeOriginal: file.name,
        tamanho: file.size,
        tipo: file.type,
        caminho: caminhoArquivo,
        url: urlPublica,
      },
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: `Erro ao salvar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Remove um arquivo do sistema de arquivos
 */
export async function deleteFile(
  caminho: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Verificar se o arquivo existe
    await access(caminho, constants.F_OK);

    // Remover arquivo
    await unlink(caminho);

    return { sucesso: true };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // Arquivo não existe, considerar como sucesso
      return { sucesso: true };
    }

    return {
      sucesso: false,
      erro: `Erro ao remover arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Verifica se um arquivo existe
 */
export async function fileExists(caminho: string): Promise<boolean> {
  try {
    await access(caminho, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém informações de um arquivo
 */
export async function getFileInfo(caminho: string) {
  try {
    const absolutePath = join(process.cwd(), 'public', caminho);
    const stats = await import('fs/promises').then(fs => fs.stat(absolutePath));

    return {
      existe: true,
      tamanho: stats.size,
      criadoEm: stats.birthtime,
      modificadoEm: stats.mtime,
      ehArquivo: stats.isFile(),
      ehDiretorio: stats.isDirectory(),
    };
  } catch {
    return {
      existe: false,
    };
  }
}

/**
 * Lista arquivos em um diretório
 */
export async function listFiles(diretorio: string) {
  try {
    const absolutePath = join(process.cwd(), 'public', diretorio);
    const { readdir, stat } = await import('fs/promises');

    const items = await readdir(absolutePath);
    const arquivos = [];

    for (const item of items) {
      const itemPath = join(absolutePath, item);
      const stats = await stat(itemPath);

      if (stats.isFile()) {
        arquivos.push({
          nome: item,
          tamanho: stats.size,
          criadoEm: stats.birthtime,
          modificadoEm: stats.mtime,
          caminho: join(diretorio, item),
        });
      }
    }

    return {
      sucesso: true,
      arquivos,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: `Erro ao listar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      arquivos: [],
    };
  }
}

/**
 * Limpa arquivos temporários antigos
 */
export async function cleanupTempFiles(idadeMaximaHoras: number = 24) {
  try {
    const tempDir = join(
      process.cwd(),
      'public',
      UPLOAD_CONFIG.UPLOAD_DIRS.TEMP
    );
    const { readdir, stat, unlink } = await import('fs/promises');

    const agora = new Date();
    const idadeMaximaMs = idadeMaximaHoras * 60 * 60 * 1000;

    const items = await readdir(tempDir);
    let removidos = 0;

    for (const item of items) {
      const itemPath = join(tempDir, item);
      const stats = await stat(itemPath);

      if (stats.isFile()) {
        const idade = agora.getTime() - stats.mtime.getTime();

        if (idade > idadeMaximaMs) {
          await unlink(itemPath);
          removidos++;
        }
      }
    }

    return {
      sucesso: true,
      removidos,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: `Erro ao limpar arquivos temporários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      removidos: 0,
    };
  }
}
