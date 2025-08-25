import { z } from 'zod';

/**
 * Schemas de validação para operações relacionadas a usuários
 * Centralizando todas as validações em um local para melhor manutenção
 */

// Schema base para validação de ID UUID
export const idUsuarioSchema = z.string().uuid('ID deve ser um UUID válido');

// Schema para validação de email
export const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .trim();

// Schema para validação de senha
export const senhaSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
  );

// Schema para validação de nome
export const nomeSchema = z
  .string()
  .min(3, 'Nome deve ter pelo menos 3 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .trim();

// Schema para validação de perfil de usuário
export const perfilUsuarioSchema = z.enum(['ADMIN', 'GESTOR', 'OPERADOR'], {
  errorMap: () => ({ message: 'Perfil deve ser ADMIN, GESTOR ou OPERADOR' }),
});

// Schema para criação de usuário
export const criarUsuarioSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  senha: senhaSchema,
  perfil: perfilUsuarioSchema,
  ativo: z.boolean().default(true),
});

// Schema para atualização de usuário
export const atualizarUsuarioSchema = z.object({
  nome: nomeSchema.optional(),
  email: emailSchema.optional(),
  senha: senhaSchema.optional(),
  perfil: perfilUsuarioSchema.optional(),
  ativo: z.boolean().optional(),
});

// Schema para listagem de usuários com filtros e paginação
export const listarUsuariosSchema = z.object({
  pagina: z.coerce.number().min(1, 'Página deve ser maior que 0').default(1),
  limite: z.coerce
    .number()
    .min(1, 'Limite deve ser maior que 0')
    .max(100, 'Limite máximo é 100')
    .default(10),
  busca: z.string().trim().optional(),
  perfil: perfilUsuarioSchema.optional(),
  ativo: z.coerce.boolean().optional(),
  ordenarPor: z
    .enum(['nome', 'email', 'criadoEm', 'atualizadoEm'])
    .default('nome'),
  ordem: z.enum(['asc', 'desc']).default('asc'),
});

// Schema para alteração de senha
export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.novaSenha === data.confirmarSenha, {
    message: 'Nova senha e confirmação devem ser iguais',
    path: ['confirmarSenha'],
  });

// Schema para redefinição de senha (admin)
export const redefinirSenhaSchema = z
  .object({
    novaSenha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
    forcarAlteracao: z.boolean().default(false),
  })
  .refine(data => data.novaSenha === data.confirmarSenha, {
    message: 'Nova senha e confirmação devem ser iguais',
    path: ['confirmarSenha'],
  });

// Schema para ativação/desativação de usuário
export const alterarStatusUsuarioSchema = z.object({
  ativo: z.boolean(),
});

// Schema para busca avançada de usuários
export const buscaAvancadaUsuariosSchema = z.object({
  termo: z.string().trim().optional(),
  perfis: z.array(perfilUsuarioSchema).optional(),
  ativo: z.boolean().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  ordenacao: z
    .object({
      campo: z.enum(['nome', 'email', 'perfil', 'criadoEm', 'atualizadoEm']),
      direcao: z.enum(['asc', 'desc']),
    })
    .optional(),
});

// Schema para exportação de dados de usuários
export const exportarUsuariosSchema = z.object({
  formato: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
  filtros: buscaAvancadaUsuariosSchema.optional(),
  campos: z
    .array(
      z.enum(['nome', 'email', 'perfil', 'ativo', 'criadoEm', 'atualizadoEm'])
    )
    .optional(),
});

// Schema para importação de usuários
export const importarUsuariosSchema = z.object({
  usuarios: z.array(criarUsuarioSchema),
  sobrescrever: z.boolean().default(false),
  enviarEmail: z.boolean().default(true),
});

// Tipos TypeScript derivados dos schemas
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type ListarUsuariosInput = z.infer<typeof listarUsuariosSchema>;
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
export type BuscaAvancadaUsuariosInput = z.infer<
  typeof buscaAvancadaUsuariosSchema
>;
export type ExportarUsuariosInput = z.infer<typeof exportarUsuariosSchema>;
export type ImportarUsuariosInput = z.infer<typeof importarUsuariosSchema>;

// Utilitários de validação
export const validarIdUsuario = (id: string) => {
  return idUsuarioSchema.safeParse(id);
};

export const validarEmail = (email: string) => {
  return emailSchema.safeParse(email);
};

export const validarSenha = (senha: string) => {
  return senhaSchema.safeParse(senha);
};

export const validarDadosUsuario = (dados: unknown) => {
  return criarUsuarioSchema.safeParse(dados);
};

// Mensagens de erro personalizadas
export const MENSAGENS_ERRO = {
  ID_INVALIDO: 'ID do usuário inválido',
  EMAIL_INVALIDO: 'Email inválido',
  EMAIL_JA_EXISTE: 'Este email já está em uso',
  SENHA_FRACA: 'Senha não atende aos critérios de segurança',
  USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado',
  PERMISSAO_NEGADA: 'Você não tem permissão para esta operação',
  DADOS_OBRIGATORIOS: 'Todos os campos obrigatórios devem ser preenchidos',
  OPERACAO_NAO_PERMITIDA: 'Operação não permitida para este usuário',
} as const;

// Validações customizadas
export const validacaoCustomizada = {
  /**
   * Valida se o email é único no sistema
   */
  emailUnico: async (email: string, idExcluir?: string) => {
    // Esta função deve ser implementada com acesso ao banco de dados
    // Retorna true se o email é único, false caso contrário
    return true; // Placeholder
  },

  /**
   * Valida se o usuário pode alterar o perfil
   */
  podeAlterarPerfil: (
    perfilAtual: string,
    novoPerfi: string,
    perfilSolicitante: string
  ) => {
    // Lógica de validação de permissões para alteração de perfil
    if (perfilSolicitante === 'ADMIN') return true;
    if (perfilSolicitante === 'GESTOR' && novoPerfi !== 'ADMIN') return true;
    return false;
  },

  /**
   * Valida se a senha atual está correta
   */
  senhaAtualCorreta: async (senhaAtual: string, hashSenha: string) => {
    // Esta função deve ser implementada com bcrypt
    // Retorna true se a senha está correta, false caso contrário
    return true; // Placeholder
  },
};
