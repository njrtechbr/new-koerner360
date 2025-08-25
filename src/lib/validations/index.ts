/**
 * Arquivo central de exportação para todas as validações do sistema
 * Facilita a importação e organização dos schemas de validação
 */

// Exportações de validações de usuários
export {
  // Schemas principais
  idUsuarioSchema,
  emailSchema,
  senhaSchema,
  nomeSchema,
  perfilUsuarioSchema,
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  listarUsuariosSchema,
  alterarSenhaSchema,
  redefinirSenhaSchema,
  alterarStatusUsuarioSchema,
  buscaAvancadaUsuariosSchema,
  exportarUsuariosSchema,
  importarUsuariosSchema,

  // Tipos TypeScript
  type CriarUsuarioInput,
  type AtualizarUsuarioInput,
  type ListarUsuariosInput,
  type AlterarSenhaInput,
  type RedefinirSenhaInput,
  type BuscaAvancadaUsuariosInput,
  type ExportarUsuariosInput,
  type ImportarUsuariosInput,

  // Utilitários
  validarIdUsuario,
  validarEmail,
  validarSenha,
  validarDadosUsuario,

  // Constantes
  MENSAGENS_ERRO,
  validacaoCustomizada,
} from './usuarios';

// Exportações de validações de autenticação
export {
  // Schemas de autenticação
  loginSchema,
  registroSchema,
  solicitarRecuperacaoSenhaSchema,
  redefinirSenhaComTokenSchema,
  verificarTokenSchema,
  gerarSenhaTemporariaSchema,
  primeiroAcessoSchema,
  validarSessaoSchema,
  logoutSchema,
  alterarEmailSchema,
  verificarEmailSchema,
  reenviarCodigoSchema,

  // Tipos TypeScript de autenticação
  type LoginInput,
  type RegistroInput,
  type SolicitarRecuperacaoSenhaInput,
  type RedefinirSenhaComTokenInput,
  type VerificarTokenInput,
  type GerarSenhaTemporariaInput,
  type PrimeiroAcessoInput,
  type ValidarSessaoInput,
  type LogoutInput,
  type AlterarEmailInput,
  type VerificarEmailInput,
  type ReenviarCodigoInput,

  // Utilitários de autenticação
  validarCredenciais,
  validarDadosRegistro,
  validarToken,

  // Constantes de autenticação
  MENSAGENS_ERRO_AUTH,
  CONFIGURACOES_SEGURANCA,
  validacaoAuthCustomizada,
} from './auth';

// Exportações de validações de atendentes
export {
  // Schemas de validação
  idAtendenteSchema,
  cpfSchema,
  telefoneSchema,
  cepSchema,
  statusAtendenteSchema,
  criarAtendenteSchema,
  atualizarAtendenteSchema,
  listarAtendentesSchema,
  filtrosAvancadosAtendentesSchema,
  buscarAtendentesSchema,
  ativarAtendenteSchema,
  desativarAtendenteSchema,

  // Tipos TypeScript
  type CriarAtendenteInput,
  type AtualizarAtendenteInput,
  type ListarAtendentesInput,
  type BuscarAtendentesInput,
  type FiltrosAvancadosAtendentesInput,
  type AtivarAtendenteInput,
  type DesativarAtendenteInput,
  type StatusAtendente,

  // Funções de validação
  validacaoAtendentes,

  // Constantes de mensagens de erro
  MENSAGENS_ERRO_ATENDENTES,
} from './atendentes';

// Exportações de validações de documentos de atendentes
export {
  // Schemas de validação
  idDocumentoSchema,
  tipoDocumentoSchema,
  criarDocumentoSchema,
  atualizarDocumentoSchema,
  listarDocumentosSchema,
  buscarDocumentosSchema,

  // Tipos TypeScript
  type CriarDocumentoInput,
  type AtualizarDocumentoInput,
  type ListarDocumentosInput,
  type BuscarDocumentosInput,
  type TipoDocumento,

  // Funções de validação
  validacaoDocumentos,

  // Constantes
  MENSAGENS_ERRO_DOCUMENTOS,
  CONFIGURACOES_DOCUMENTOS,
} from './documentos-atendentes';

// Exportações de validações de histórico de atendentes
export {
  // Schemas de validação
  idHistoricoSchema,
  tipoAlteracaoSchema,
  criarHistoricoSchema,
  listarHistoricoSchema,
  buscarHistoricoSchema,
  estatisticasHistoricoSchema,

  // Tipos TypeScript
  type TipoAlteracao,
  type CriarHistoricoInput,
  type ListarHistoricoInput,
  type BuscarHistoricoInput,
  type EstatisticasHistoricoInput,

  // Funções de validação
  validacaoHistorico,
  validacaoHistoricoCustomizada,

  // Constantes
  MENSAGENS_ERRO_HISTORICO,
  CONFIGURACOES_HISTORICO,
} from './historico-atendentes';

// Utilitários gerais de validação
export const validacaoUtils = {
  /**
   * Valida se um valor é um UUID válido
   */
  isUUID: (valor: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(valor);
  },

  /**
   * Valida se um valor é um email válido
   */
  isEmail: (valor: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(valor);
  },

  /**
   * Valida se uma string contém apenas números
   */
  isNumerico: (valor: string): boolean => {
    return /^\d+$/.test(valor);
  },

  /**
   * Valida se uma string é um CPF válido
   */
  isCPF: (cpf: string): boolean => {
    // Remove caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cpfLimpo.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    // Validação dos dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    const digitoVerificador1 = resto < 2 ? 0 : resto;

    if (parseInt(cpfLimpo.charAt(9)) !== digitoVerificador1) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    const digitoVerificador2 = resto < 2 ? 0 : resto;

    return parseInt(cpfLimpo.charAt(10)) === digitoVerificador2;
  },

  /**
   * Valida se uma string é um telefone válido (formato brasileiro)
   */
  isTelefone: (telefone: string): boolean => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return /^\d{10,11}$/.test(telefoneLimpo);
  },

  /**
   * Sanitiza uma string removendo caracteres especiais
   */
  sanitizar: (valor: string): string => {
    return valor.replace(/[<>"'&]/g, '');
  },

  /**
   * Formata um CPF
   */
  formatarCPF: (cpf: string): string => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  /**
   * Formata um telefone
   */
  formatarTelefone: (telefone: string): string => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length === 10) {
      return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telefoneLimpo.length === 11) {
      return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  },
};

// Constantes gerais
export const CONSTANTES_VALIDACAO = {
  TAMANHO_MINIMO_NOME: 3,
  TAMANHO_MAXIMO_NOME: 100,
  TAMANHO_MINIMO_SENHA: 8,
  TAMANHO_MAXIMO_SENHA: 128,
  LIMITE_MAXIMO_PAGINACAO: 100,
  LIMITE_PADRAO_PAGINACAO: 10,
} as const;

// Tipos de erro padronizados
export interface ErroValidacao {
  campo: string;
  mensagem: string;
  codigo: string;
}

export interface ResultadoValidacao<T = unknown> {
  sucesso: boolean;
  dados?: T;
  erros?: ErroValidacao[];
}

// Função utilitária para criar resultado de validação
export const criarResultadoValidacao = <T>(
  sucesso: boolean,
  dados?: T,
  erros?: ErroValidacao[]
): ResultadoValidacao<T> => {
  return {
    sucesso,
    dados,
    erros,
  };
};
