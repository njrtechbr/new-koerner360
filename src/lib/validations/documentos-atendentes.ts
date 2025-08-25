import { z } from 'zod';
import { validacaoUtils } from './index';

/**
 * Schema para validação de ID de documento
 */
export const idDocumentoSchema = z
  .string()
  .cuid('ID do documento deve ser um CUID válido');

/**
 * Schema para tipos de documento
 */
export const tipoDocumentoSchema = z.enum([
  'RG',
  'CPF',
  'CNH',
  'CARTEIRA_TRABALHO',
  'COMPROVANTE_RESIDENCIA',
  'DIPLOMA',
  'CERTIFICADO',
  'CONTRATO',
  'OUTROS',
]);

/**
 * Schema para criar documento de atendente
 */
export const criarDocumentoSchema = z.object({
  tipo: tipoDocumentoSchema,
  nome: z
    .string()
    .min(1, 'Nome do arquivo é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  arquivo: z.string().url('URL do arquivo deve ser válida'),
  tamanho: z
    .number()
    .int()
    .positive('Tamanho deve ser um número positivo')
    .optional(),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório').optional(),
  versao: z
    .number()
    .int()
    .positive('Versão deve ser um número positivo')
    .default(1),
});

/**
 * Schema para atualizar documento de atendente
 */
export const atualizarDocumentoSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome do arquivo é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  arquivo: z.string().url('URL do arquivo deve ser válida').optional(),
  tamanho: z
    .number()
    .int()
    .positive('Tamanho deve ser um número positivo')
    .optional(),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório').optional(),
  versao: z
    .number()
    .int()
    .positive('Versão deve ser um número positivo')
    .optional(),
  ativo: z.boolean().optional(),
});

/**
 * Schema para listar documentos
 */
export const listarDocumentosSchema = z.object({
  pagina: z.coerce
    .number()
    .int()
    .min(1, 'Página deve ser um número inteiro positivo')
    .default(1),
  limite: z.coerce
    .number()
    .int()
    .min(1, 'Limite deve ser um número inteiro positivo')
    .max(100, 'Limite máximo é 100')
    .default(10),
  tipo: tipoDocumentoSchema.optional(),
  ativo: z.coerce.boolean().optional(),
  ordenarPor: z
    .enum(['nome', 'tipo', 'criadoEm', 'atualizadoEm'])
    .default('criadoEm'),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema para buscar documentos
 */
export const buscarDocumentosSchema = z.object({
  busca: z.string().min(1, 'Termo de busca é obrigatório'),
  tipo: tipoDocumentoSchema.optional(),
  ativo: z.coerce.boolean().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  pagina: z.coerce
    .number()
    .int()
    .min(1, 'Página deve ser um número inteiro positivo')
    .default(1),
  limite: z.coerce
    .number()
    .int()
    .min(1, 'Limite deve ser um número inteiro positivo')
    .max(100, 'Limite máximo é 100')
    .default(10),
});

/**
 * Tipos TypeScript derivados dos schemas
 */
export type CriarDocumentoInput = z.infer<typeof criarDocumentoSchema>;
export type AtualizarDocumentoInput = z.infer<typeof atualizarDocumentoSchema>;
export type ListarDocumentosInput = z.infer<typeof listarDocumentosSchema>;
export type BuscarDocumentosInput = z.infer<typeof buscarDocumentosSchema>;
export type TipoDocumento = z.infer<typeof tipoDocumentoSchema>;

/**
 * Mensagens de erro personalizadas para documentos
 */
export const MENSAGENS_ERRO_DOCUMENTOS = {
  DOCUMENTO_NAO_ENCONTRADO: 'Documento não encontrado',
  TIPO_DOCUMENTO_INVALIDO: 'Tipo de documento inválido',
  ARQUIVO_MUITO_GRANDE: 'Arquivo muito grande',
  FORMATO_ARQUIVO_INVALIDO: 'Formato de arquivo inválido',
  DOCUMENTO_JA_EXISTE: 'Documento do mesmo tipo já existe para este atendente',
  SEM_PERMISSAO_DOCUMENTO: 'Sem permissão para acessar este documento',
  ERRO_UPLOAD: 'Erro ao fazer upload do arquivo',
  VERSAO_INVALIDA: 'Versão do documento inválida',
} as const;

/**
 * Configurações para validação de documentos
 */
export const CONFIGURACOES_DOCUMENTOS = {
  TAMANHO_MAXIMO_ARQUIVO: 10 * 1024 * 1024, // 10MB
  TIPOS_MIME_PERMITIDOS: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  EXTENSOES_PERMITIDAS: [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
  ],
} as const;

/**
 * Utilitários de validação específicos para documentos
 */
export const validacaoDocumentos = {
  /**
   * Valida se o tipo MIME é permitido
   */
  validarTipoMime: (mimeType: string): boolean => {
    return CONFIGURACOES_DOCUMENTOS.TIPOS_MIME_PERMITIDOS.includes(mimeType);
  },

  /**
   * Valida se a extensão do arquivo é permitida
   */
  validarExtensao: (nomeArquivo: string): boolean => {
    const extensao = nomeArquivo
      .toLowerCase()
      .substring(nomeArquivo.lastIndexOf('.'));
    return CONFIGURACOES_DOCUMENTOS.EXTENSOES_PERMITIDAS.includes(extensao);
  },

  /**
   * Valida se o tamanho do arquivo está dentro do limite
   */
  validarTamanhoArquivo: (tamanho: number): boolean => {
    return tamanho <= CONFIGURACOES_DOCUMENTOS.TAMANHO_MAXIMO_ARQUIVO;
  },

  /**
   * Gera nome único para arquivo
   */
  gerarNomeUnico: (nomeOriginal: string): string => {
    const timestamp = Date.now();
    const extensao = nomeOriginal.substring(nomeOriginal.lastIndexOf('.'));
    const nomeBase = nomeOriginal
      .substring(0, nomeOriginal.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9]/g, '_');
    return `${nomeBase}_${timestamp}${extensao}`;
  },

  /**
   * Valida se um documento já existe para o atendente
   */
  validarDocumentoUnico: async (
    atendenteId: string,
    tipo: TipoDocumento,
    documentoId?: string
  ): Promise<boolean> => {
    const { prisma } = await import('@/lib/prisma');

    const documentoExistente = await prisma.documentoAtendente.findFirst({
      where: {
        atendenteId,
        tipo,
        ativo: true,
        ...(documentoId && { id: { not: documentoId } }),
      },
    });

    return !documentoExistente;
  },

  /**
   * Formata informações do documento para exibição
   */
  formatarInfoDocumento: (documento: any) => {
    return {
      id: documento.id,
      tipo: documento.tipo,
      nome: documento.nome,
      descricao: documento.descricao,
      tamanho: documento.tamanho
        ? `${(documento.tamanho / 1024).toFixed(2)} KB`
        : null,
      versao: documento.versao,
      ativo: documento.ativo,
      criadoEm: documento.criadoEm,
      atualizadoEm: documento.atualizadoEm,
    };
  },
};
