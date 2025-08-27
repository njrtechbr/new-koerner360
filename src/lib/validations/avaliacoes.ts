import { z } from 'zod';

// Schema base para validação de UUID
const uuidSchema = z.string().uuid('ID deve ser um UUID válido');

// Schema para validação de data
const dateSchema = z.string().datetime('Data deve estar no formato ISO 8601');

// Schema para validação de nota (1-5)
const notaSchema = z.number()
  .int('Nota deve ser um número inteiro')
  .min(1, 'Nota mínima é 1')
  .max(5, 'Nota máxima é 5');

// Schema para validação de comentário
const comentarioSchema = z.string()
  .max(1000, 'Comentário deve ter no máximo 1000 caracteres')
  .optional();

// Schema para validação de status de avaliação
const statusAvaliacaoSchema = z.enum(['PENDENTE', 'CONCLUIDA', 'CANCELADA'], {
  errorMap: () => ({ message: 'Status deve ser PENDENTE, CONCLUIDA ou CANCELADA' })
});

// Schema para validação de status de período
const statusPeriodoSchema = z.enum(['PLANEJADO', 'ATIVO', 'FINALIZADO', 'CANCELADO'], {
  errorMap: () => ({ message: 'Status deve ser PLANEJADO, ATIVO, FINALIZADO ou CANCELADO' })
});

// Schema para validação de paginação
const paginacaoSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Página deve ser um número')
    .transform(Number)
    .refine(val => val >= 1, 'Página deve ser maior que 0')
    .optional()
    .default('1'),
  limit: z.string()
    .regex(/^\d+$/, 'Limite deve ser um número')
    .transform(Number)
    .refine(val => val >= 1 && val <= 100, 'Limite deve estar entre 1 e 100')
    .optional()
    .default('10')
});

// Schema para validação de ordenação
const ordenacaoSchema = z.object({
  orderBy: z.enum(['nome', 'dataInicio', 'dataFim', 'criadoEm', 'dataAvaliacao', 'nota'], {
    errorMap: () => ({ message: 'Campo de ordenação inválido' })
  }).optional().default('dataAvaliacao'),
  orderDirection: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Direção de ordenação deve ser asc ou desc' })
  }).optional().default('desc')
});

// SCHEMAS PARA AVALIAÇÕES

// Schema para criação de avaliação
export const criarAvaliacaoSchema = z.object({
  avaliadoId: uuidSchema,
  periodoId: uuidSchema,
  nota: notaSchema,
  comentario: comentarioSchema,
}).refine(async (data) => {
  // Validação customizada será feita no endpoint
  return true;
}, {
  message: 'Dados de avaliação inválidos'
});

// Schema para atualização de avaliação
export const atualizarAvaliacaoSchema = z.object({
  nota: notaSchema.optional(),
  comentario: comentarioSchema,
  status: statusAvaliacaoSchema.optional(),
}).refine((data) => {
  // Pelo menos um campo deve ser fornecido
  return data.nota !== undefined || data.comentario !== undefined || data.status !== undefined;
}, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
  path: ['root']
});

// Schema para filtros de consulta de avaliações
export const filtrosAvaliacaoSchema = z.object({
  periodoId: uuidSchema.optional(),
  avaliadoId: uuidSchema.optional(),
  avaliadorId: uuidSchema.optional(),
  status: statusAvaliacaoSchema.optional(),
  notaMinima: z.string()
    .regex(/^[1-5]$/, 'Nota mínima deve estar entre 1 e 5')
    .transform(Number)
    .optional(),
  notaMaxima: z.string()
    .regex(/^[1-5]$/, 'Nota máxima deve estar entre 1 e 5')
    .transform(Number)
    .optional(),
  dataInicio: dateSchema.optional(),
  dataFim: dateSchema.optional(),
  setor: z.string().max(100, 'Setor deve ter no máximo 100 caracteres').optional(),
  departamento: z.string().max(100, 'Departamento deve ter no máximo 100 caracteres').optional(),
  cargo: z.string().max(100, 'Cargo deve ter no máximo 100 caracteres').optional(),
  ...paginacaoSchema.shape,
  ...ordenacaoSchema.shape
}).refine((data) => {
  // Validar que nota mínima não seja maior que nota máxima
  if (data.notaMinima && data.notaMaxima) {
    return data.notaMinima <= data.notaMaxima;
  }
  return true;
}, {
  message: 'Nota mínima não pode ser maior que nota máxima',
  path: ['notaMaxima']
}).refine((data) => {
  // Validar que data início não seja posterior à data fim
  if (data.dataInicio && data.dataFim) {
    return new Date(data.dataInicio) <= new Date(data.dataFim);
  }
  return true;
}, {
  message: 'Data de início não pode ser posterior à data de fim',
  path: ['dataFim']
});

// SCHEMAS PARA PERÍODOS DE AVALIAÇÃO

// Schema para criação de período
export const criarPeriodoSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
  dataInicio: dateSchema,
  dataFim: dateSchema,
  status: statusPeriodoSchema.optional().default('PLANEJADO'),
}).refine((data) => {
  const inicio = new Date(data.dataInicio);
  const fim = new Date(data.dataFim);
  const agora = new Date();
  
  // Data de início deve ser anterior à data de fim
  if (inicio >= fim) {
    return false;
  }
  
  // Se status for ATIVO, período deve estar dentro das datas
  if (data.status === 'ATIVO') {
    return agora >= inicio && agora <= fim;
  }
  
  return true;
}, {
  message: 'Datas do período são inválidas ou incompatíveis com o status',
  path: ['dataFim']
});

// Schema para atualização de período
export const atualizarPeriodoSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
  dataInicio: dateSchema.optional(),
  dataFim: dateSchema.optional(),
  status: statusPeriodoSchema.optional(),
}).refine((data) => {
  // Se ambas as datas forem fornecidas, validar
  if (data.dataInicio && data.dataFim) {
    const inicio = new Date(data.dataInicio);
    const fim = new Date(data.dataFim);
    return inicio < fim;
  }
  return true;
}, {
  message: 'Data de início deve ser anterior à data de fim',
  path: ['dataFim']
}).refine((data) => {
  // Pelo menos um campo deve ser fornecido
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
  path: ['root']
});

// Schema para filtros de consulta de períodos
export const filtrosPeriodoSchema = z.object({
  status: statusPeriodoSchema.optional(),
  dataInicio: dateSchema.optional(),
  dataFim: dateSchema.optional(),
  criadoPor: uuidSchema.optional(),
  nome: z.string().max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  ...paginacaoSchema.shape,
  ...ordenacaoSchema.shape
}).refine((data) => {
  // Validar que data início não seja posterior à data fim
  if (data.dataInicio && data.dataFim) {
    return new Date(data.dataInicio) <= new Date(data.dataFim);
  }
  return true;
}, {
  message: 'Data de início não pode ser posterior à data de fim',
  path: ['dataFim']
});

// SCHEMAS PARA RELATÓRIOS

// Schema para filtros de relatório
export const filtrosRelatorioSchema = z.object({
  periodoId: uuidSchema.optional(),
  avaliadoId: uuidSchema.optional(),
  avaliadorId: uuidSchema.optional(),
  setor: z.string().max(100, 'Setor deve ter no máximo 100 caracteres').optional(),
  departamento: z.string().max(100, 'Departamento deve ter no máximo 100 caracteres').optional(),
  cargo: z.string().max(100, 'Cargo deve ter no máximo 100 caracteres').optional(),
  dataInicio: dateSchema.optional(),
  dataFim: dateSchema.optional(),
  incluirDetalhes: z.string()
    .transform(val => val === 'true')
    .optional()
    .default('false'),
  formato: z.enum(['resumo', 'detalhado', 'estatisticas'], {
    errorMap: () => ({ message: 'Formato deve ser resumo, detalhado ou estatisticas' })
  }).optional().default('resumo'),
}).refine((data) => {
  // Validar que data início não seja posterior à data fim
  if (data.dataInicio && data.dataFim) {
    return new Date(data.dataInicio) <= new Date(data.dataFim);
  }
  return true;
}, {
  message: 'Data de início não pode ser posterior à data de fim',
  path: ['dataFim']
});

// SCHEMAS PARA PARÂMETROS DE ROTA

// Schema para validação de ID em parâmetros de rota
export const idParamSchema = z.object({
  id: uuidSchema
});

// TIPOS TYPESCRIPT DERIVADOS DOS SCHEMAS

export type CriarAvaliacaoInput = z.infer<typeof criarAvaliacaoSchema>;
export type AtualizarAvaliacaoInput = z.infer<typeof atualizarAvaliacaoSchema>;
export type FiltrosAvaliacaoInput = z.infer<typeof filtrosAvaliacaoSchema>;

export type CriarPeriodoInput = z.infer<typeof criarPeriodoSchema>;
export type AtualizarPeriodoInput = z.infer<typeof atualizarPeriodoSchema>;
export type FiltrosPeriodoInput = z.infer<typeof filtrosPeriodoSchema>;

export type FiltrosRelatorioInput = z.infer<typeof filtrosRelatorioSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;

// FUNÇÕES UTILITÁRIAS PARA VALIDAÇÃO

/**
 * Valida dados de entrada e retorna resultado tipado
 * @param schema Schema Zod para validação
 * @param data Dados a serem validados
 * @returns Resultado da validação
 */
export function validarDados<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const resultado = schema.parse(data);
    return { sucesso: true, dados: resultado, erro: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        dados: null,
        erro: {
          message: 'Dados inválidos',
          details: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message,
            valorRecebido: err.received
          }))
        }
      };
    }
    return {
      sucesso: false,
      dados: null,
      erro: { message: 'Erro de validação desconhecido' }
    };
  }
}

/**
 * Middleware para validação automática de query parameters
 * @param schema Schema para validação
 * @param searchParams URLSearchParams da requisição
 * @returns Dados validados ou erro
 */
export function validarQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams) {
  const params = Object.fromEntries(searchParams);
  return validarDados(schema, params);
}

/**
 * Middleware para validação automática de body da requisição
 * @param schema Schema para validação
 * @param body Body da requisição já parseado
 * @returns Dados validados ou erro
 */
export function validarBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  return validarDados(schema, body);
}