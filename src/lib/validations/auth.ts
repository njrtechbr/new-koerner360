import { z } from 'zod';
import {
  emailSchema,
  senhaSchema,
  nomeSchema,
  perfilUsuarioSchema,
} from './usuarios';

/**
 * Schemas de validação para operações de autenticação
 * Centralizando validações de login, registro, recuperação de senha, etc.
 */

// Schema para login
export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Senha é obrigatória'),
  lembrarMe: z.boolean().default(false),
});

// Schema para registro de usuário
export const registroSchema = z
  .object({
    nome: nomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
    userType: z.enum(['ADMIN', 'GESTOR', 'ATENDENTE'], {
      errorMap: () => ({ message: 'Tipo de usuário inválido' }),
    }),
    aceitarTermos: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
  })
  .refine(data => data.senha === data.confirmarSenha, {
    message: 'Senha e confirmação devem ser iguais',
    path: ['confirmarSenha'],
  });

// Schema para solicitação de recuperação de senha
export const solicitarRecuperacaoSenhaSchema = z.object({
  email: emailSchema,
});

// Schema para redefinição de senha com token
export const redefinirSenhaComTokenSchema = z
  .object({
    token: z.string().min(1, 'Token é obrigatório'),
    novaSenha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.novaSenha === data.confirmarSenha, {
    message: 'Nova senha e confirmação devem ser iguais',
    path: ['confirmarSenha'],
  });

// Schema para verificação de token
export const verificarTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

// Schema para geração de senha temporária (admin)
export const gerarSenhaTemporariaSchema = z.object({
  email: emailSchema,
  adminKey: z.string().min(1, 'Chave de administrador é obrigatória'),
});

// Schema para primeiro acesso (alteração de senha temporária)
export const primeiroAcessoSchema = z
  .object({
    email: emailSchema,
    senhaTemporaria: z.string().min(1, 'Senha temporária é obrigatória'),
    novaSenha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.novaSenha === data.confirmarSenha, {
    message: 'Nova senha e confirmação devem ser iguais',
    path: ['confirmarSenha'],
  });

// Schema para validação de sessão
export const validarSessaoSchema = z.object({
  token: z.string().min(1, 'Token de sessão é obrigatório'),
  refreshToken: z.string().optional(),
});

// Schema para logout
export const logoutSchema = z.object({
  token: z.string().optional(),
  logoutTodos: z.boolean().default(false),
});

// Schema para alteração de email
export const alterarEmailSchema = z
  .object({
    emailAtual: emailSchema,
    novoEmail: emailSchema,
    senha: z.string().min(1, 'Senha é obrigatória para confirmar a alteração'),
  })
  .refine(data => data.emailAtual !== data.novoEmail, {
    message: 'O novo email deve ser diferente do atual',
    path: ['novoEmail'],
  });

// Schema para verificação de email
export const verificarEmailSchema = z.object({
  email: emailSchema,
  codigo: z.string().length(6, 'Código deve ter 6 dígitos'),
});

// Schema para reenvio de código de verificação
export const reenviarCodigoSchema = z.object({
  email: emailSchema,
  tipo: z.enum(['verificacao', 'recuperacao'], {
    errorMap: () => ({ message: 'Tipo deve ser verificacao ou recuperacao' }),
  }),
});

// Tipos TypeScript derivados dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type SolicitarRecuperacaoSenhaInput = z.infer<
  typeof solicitarRecuperacaoSenhaSchema
>;
export type RedefinirSenhaComTokenInput = z.infer<
  typeof redefinirSenhaComTokenSchema
>;
export type VerificarTokenInput = z.infer<typeof verificarTokenSchema>;
export type GerarSenhaTemporariaInput = z.infer<
  typeof gerarSenhaTemporariaSchema
>;
export type PrimeiroAcessoInput = z.infer<typeof primeiroAcessoSchema>;
export type ValidarSessaoInput = z.infer<typeof validarSessaoSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type AlterarEmailInput = z.infer<typeof alterarEmailSchema>;
export type VerificarEmailInput = z.infer<typeof verificarEmailSchema>;
export type ReenviarCodigoInput = z.infer<typeof reenviarCodigoSchema>;

// Utilitários de validação para autenticação
export const validarCredenciais = (dados: unknown) => {
  return loginSchema.safeParse(dados);
};

export const validarDadosRegistro = (dados: unknown) => {
  return registroSchema.safeParse(dados);
};

export const validarToken = (token: string) => {
  return verificarTokenSchema.safeParse({ token });
};

// Mensagens de erro específicas para autenticação
export const MENSAGENS_ERRO_AUTH = {
  CREDENCIAIS_INVALIDAS: 'Email ou senha incorretos',
  CONTA_INATIVA: 'Sua conta está inativa. Entre em contato com o administrador',
  CONTA_BLOQUEADA:
    'Sua conta foi bloqueada devido a múltiplas tentativas de login',
  TOKEN_INVALIDO: 'Token inválido ou expirado',
  TOKEN_EXPIRADO: 'Token expirado. Solicite um novo',
  EMAIL_NAO_VERIFICADO: 'Email não verificado. Verifique sua caixa de entrada',
  SENHA_TEMPORARIA_EXPIRADA: 'Senha temporária expirada. Solicite uma nova',
  SESSAO_EXPIRADA: 'Sua sessão expirou. Faça login novamente',
  ACESSO_NEGADO:
    'Acesso negado. Você não tem permissão para acessar este recurso',
  MUITAS_TENTATIVAS:
    'Muitas tentativas de login. Tente novamente em alguns minutos',
} as const;

// Configurações de segurança
export const CONFIGURACOES_SEGURANCA = {
  MAX_TENTATIVAS_LOGIN: 5,
  TEMPO_BLOQUEIO_MINUTOS: 15,
  DURACAO_TOKEN_RECUPERACAO_HORAS: 1,
  DURACAO_SESSAO_HORAS: 24,
  DURACAO_REFRESH_TOKEN_DIAS: 7,
  TAMANHO_CODIGO_VERIFICACAO: 6,
  DURACAO_CODIGO_VERIFICACAO_MINUTOS: 10,
} as const;

// Validações customizadas para autenticação
export const validacaoAuthCustomizada = {
  /**
   * Valida se o usuário pode fazer login
   */
  podeLogar: async (email: string) => {
    // Verificar se a conta está ativa, não bloqueada, etc.
    return { podeLogar: true, motivo: null };
  },

  /**
   * Valida força da senha
   */
  validarForcaSenha: (senha: string) => {
    const criterios = {
      tamanho: senha.length >= 8,
      minuscula: /[a-z]/.test(senha),
      maiuscula: /[A-Z]/.test(senha),
      numero: /\d/.test(senha),
      especial: /[@$!%*?&]/.test(senha),
    };

    const pontuacao = Object.values(criterios).filter(Boolean).length;

    return {
      valida: pontuacao === 5,
      pontuacao,
      criterios,
      nivel: pontuacao < 3 ? 'fraca' : pontuacao < 5 ? 'media' : 'forte',
    };
  },

  /**
   * Gera código de verificação
   */
  gerarCodigoVerificacao: () => {
    return Math.random().toString().slice(2, 8).padStart(6, '0');
  },

  /**
   * Valida formato de token JWT
   */
  validarFormatoToken: (token: string) => {
    const partes = token.split('.');
    return partes.length === 3;
  },
};
