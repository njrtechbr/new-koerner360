import { z } from 'zod';
import { validacaoUtils } from './index';

/**
 * Schema para validação de ID de atendente
 */
export const idAtendenteSchema = z
  .string()
  .cuid('ID do atendente deve ser um CUID válido');

/**
 * Schema para validação de CPF
 */
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF deve ter no máximo 14 caracteres')
  .refine(cpf => validacaoUtils.isCPF(cpf.replace(/\D/g, '')), {
    message: 'CPF inválido',
  });

/**
 * Schema para validação de telefone
 */
export const telefoneSchema = z
  .string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .refine(telefone => validacaoUtils.isTelefone(telefone), {
    message: 'Formato de telefone inválido',
  });

/**
 * Schema para validação de CEP
 */
export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000');

/**
 * Schema para status de atendente
 */
export const statusAtendenteSchema = z.enum([
  'ATIVO',
  'INATIVO',
  'SUSPENSO',
  'TREINAMENTO',
  'FERIAS',
  'AFASTADO',
  'LICENCA_MEDICA',
  'LICENCA_MATERNIDADE',
]);

/**
 * Schema para criar atendente
 */
export const criarAtendenteSchema = z.object({
  // Dados do usuário relacionado
  usuario: z.object({
    nome: z
      .string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    userType: z.literal('ATENDENTE'),
  }),

  // Dados pessoais
  cpf: cpfSchema,
  rg: z.string().optional(),
  dataNascimento: z.string().datetime().optional(),
  telefone: telefoneSchema,
  celular: telefoneSchema.optional(),

  // Endereço
  endereco: z
    .string()
    .max(255, 'Endereço deve ter no máximo 255 caracteres')
    .optional(),
  cep: cepSchema.optional(),
  cidade: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),

  // Dados profissionais
  dataAdmissao: z
    .string()
    .datetime('Data de admissão deve ser uma data válida'),
  cargo: z
    .string()
    .min(2, 'Cargo deve ter pelo menos 2 caracteres')
    .max(100, 'Cargo deve ter no máximo 100 caracteres'),
  setor: z
    .string()
    .min(2, 'Setor deve ter pelo menos 2 caracteres')
    .max(100, 'Setor deve ter no máximo 100 caracteres'),
  departamento: z
    .string()
    .max(100, 'Departamento deve ter no máximo 100 caracteres')
    .optional(),
  salario: z.number().positive('Salário deve ser um valor positivo').optional(),
  status: statusAtendenteSchema.default('ATIVO'),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
  foto: z.string().url('URL da foto deve ser válida').optional(),
});

/**
 * Schema para atualizar atendente
 */
export const atualizarAtendenteSchema = z.object({
  // Dados pessoais
  rg: z.string().optional(),
  dataNascimento: z.string().datetime().optional(),
  telefone: telefoneSchema.optional(),
  celular: telefoneSchema.optional(),

  // Endereço
  endereco: z
    .string()
    .max(255, 'Endereço deve ter no máximo 255 caracteres')
    .optional(),
  cep: cepSchema.optional(),
  cidade: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),

  // Dados profissionais
  dataAdmissao: z
    .string()
    .datetime('Data de admissão deve ser uma data válida')
    .optional(),
  cargo: z
    .string()
    .min(2, 'Cargo deve ter pelo menos 2 caracteres')
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .optional(),
  setor: z
    .string()
    .min(2, 'Setor deve ter pelo menos 2 caracteres')
    .max(100, 'Setor deve ter no máximo 100 caracteres')
    .optional(),
  departamento: z
    .string()
    .max(100, 'Departamento deve ter no máximo 100 caracteres')
    .optional(),
  salario: z.number().positive('Salário deve ser um valor positivo').optional(),
  status: statusAtendenteSchema.optional(),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
  foto: z.string().url('URL da foto deve ser válida').optional(),
});

/**
 * Schema para listar atendentes
 */
export const listarAtendentesSchema = z.object({
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
  busca: z.string().optional(),
  status: statusAtendenteSchema.optional(),
  setor: z.string().optional(),
  cargo: z.string().optional(),
  departamento: z.string().optional(),
  dataAdmissaoInicio: z.string().datetime().optional(),
  dataAdmissaoFim: z.string().datetime().optional(),
  ordenarPor: z
    .enum([
      'nome',
      'cpf',
      'cargo',
      'setor',
      'dataAdmissao',
      'status',
      'criadoEm',
    ])
    .default('nome'),
  ordem: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Schema para filtros avançados de atendentes
 */
export const filtrosAvancadosAtendentesSchema = z.object({
  ativo: z.boolean().optional(),
  temFoto: z.boolean().optional(),
  salarioMinimo: z.number().positive().optional(),
  salarioMaximo: z.number().positive().optional(),
  idadeMinima: z.number().int().min(16).optional(),
  idadeMaxima: z.number().int().max(100).optional(),
  tempoEmpresaMinimo: z.number().int().min(0).optional(), // em meses
  tempoEmpresaMaximo: z.number().int().optional(), // em meses
});

/**
 * Schema para busca de atendentes
 */
export const buscarAtendentesSchema = listarAtendentesSchema.extend({
  filtrosAvancados: filtrosAvancadosAtendentesSchema.optional(),
});

/**
 * Schema para ativar atendente
 */
export const ativarAtendenteSchema = z.object({
  motivo: z
    .string()
    .min(1, 'Motivo da ativação é obrigatório')
    .max(500, 'Motivo deve ter no máximo 500 caracteres'),
  novoStatus: z
    .enum(['ATIVO', 'FERIAS', 'AFASTADO'])
    .optional()
    .default('ATIVO'),
});

/**
 * Schema para desativar atendente
 */
export const desativarAtendenteSchema = z
  .object({
    motivo: z
      .string()
      .min(1, 'Motivo da desativação é obrigatório')
      .max(500, 'Motivo deve ter no máximo 500 caracteres'),
    tipoDesativacao: z.enum(['TEMPORARIA', 'DEFINITIVA']).default('TEMPORARIA'),
    dataReativacao: z
      .string()
      .datetime('Data de reativação deve ser uma data válida')
      .optional(),
  })
  .refine(
    data => {
      // Se for desativação temporária, data de reativação é obrigatória
      if (data.tipoDesativacao === 'TEMPORARIA' && !data.dataReativacao) {
        return false;
      }
      // Se for definitiva, não deve ter data de reativação
      if (data.tipoDesativacao === 'DEFINITIVA' && data.dataReativacao) {
        return false;
      }
      // Se tem data de reativação, deve ser futura
      if (data.dataReativacao && new Date(data.dataReativacao) <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message:
        'Para desativação temporária, informe uma data de reativação futura. Para desativação definitiva, não informe data de reativação.',
    }
  );

// Tipos TypeScript derivados dos schemas
export type CriarAtendenteInput = z.infer<typeof criarAtendenteSchema>;
export type AtualizarAtendenteInput = z.infer<typeof atualizarAtendenteSchema>;
export type ListarAtendentesInput = z.infer<typeof listarAtendentesSchema>;
export type BuscarAtendentesInput = z.infer<typeof buscarAtendentesSchema>;
export type FiltrosAvancadosAtendentesInput = z.infer<
  typeof filtrosAvancadosAtendentesSchema
>;
export type StatusAtendente = z.infer<typeof statusAtendenteSchema>;
export type AtivarAtendenteInput = z.infer<typeof ativarAtendenteSchema>;
export type DesativarAtendenteInput = z.infer<typeof desativarAtendenteSchema>;

/**
 * Mensagens de erro personalizadas
 */
export const MENSAGENS_ERRO_ATENDENTES = {
  CPF_INVALIDO: 'CPF informado é inválido',
  CPF_JA_EXISTE: 'CPF já está cadastrado no sistema',
  EMAIL_JA_EXISTE: 'Email já está cadastrado no sistema',
  ATENDENTE_NAO_ENCONTRADO: 'Atendente não encontrado',
  DADOS_INVALIDOS: 'Dados fornecidos são inválidos',
  ERRO_INTERNO: 'Erro interno do servidor',
  SEM_PERMISSAO: 'Sem permissão para realizar esta operação',
  TELEFONE_INVALIDO: 'Formato de telefone inválido',
  CEP_INVALIDO: 'CEP deve estar no formato 00000-000',
  DATA_INVALIDA: 'Data fornecida é inválida',
  SALARIO_INVALIDO: 'Salário deve ser um valor positivo',
  STATUS_INVALIDO: 'Status fornecido é inválido',
} as const;

/**
 * Utilitários de validação específicos para atendentes
 */
export const validacaoAtendentes = {
  /**
   * Valida se um CPF já existe no sistema
   */
  validarCPFUnico: async (
    cpf: string,
    atendenteId?: string
  ): Promise<boolean> => {
    const { prisma } = await import('@/lib/prisma');

    const cpfLimpo = cpf.replace(/\D/g, '');
    const atendenteExistente = await prisma.atendente.findFirst({
      where: {
        cpf: cpfLimpo,
        ...(atendenteId && { id: { not: atendenteId } }),
      },
    });

    return !atendenteExistente;
  },

  /**
   * Valida se um email já existe no sistema
   */
  validarEmailUnico: async (
    email: string,
    usuarioId?: string
  ): Promise<boolean> => {
    const { prisma } = await import('@/lib/prisma');

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        email,
        ...(usuarioId && { id: { not: usuarioId } }),
      },
    });

    return !usuarioExistente;
  },

  /**
   * Calcula a idade baseada na data de nascimento
   */
  calcularIdade: (dataNascimento: Date): number => {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();

    if (
      mesAtual < dataNascimento.getMonth() ||
      (mesAtual === dataNascimento.getMonth() &&
        diaAtual < dataNascimento.getDate())
    ) {
      idade--;
    }

    return idade;
  },

  /**
   * Calcula o tempo de empresa em meses
   */
  calcularTempoEmpresa: (dataAdmissao: Date): number => {
    const hoje = new Date();
    const meses =
      (hoje.getFullYear() - dataAdmissao.getFullYear()) * 12 +
      (hoje.getMonth() - dataAdmissao.getMonth());
    return Math.max(0, meses);
  },
};
