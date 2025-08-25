// Tipos gerados pelo Prisma
export type {
  Usuario,
  Atendente,
  Avaliacao,
  Feedback,
  GamificacaoAtendente,
  Conquista,
  ConquistaAtendente,
  TipoUsuario,
  StatusAtendente,
  TipoFeedback,
  StatusFeedback,
  PrioridadeFeedback,
} from '../generated/prisma';

// Tipos personalizados para operações específicas
export interface UsuarioComAtendente {
  id: string;
  email: string;
  nome: string;
  userType: TipoUsuario;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  atendente?: Atendente | null;
}

export interface AtendenteComUsuario {
  id: string;
  usuarioId: string;
  cpf: string;
  telefone: string;
  endereco?: string | null;
  dataAdmissao: Date;
  cargo: string;
  setor: string;
  salario?: number | null;
  status: StatusAtendente;
  observacoes?: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  usuario: Usuario;
}

export interface AvaliacaoCompleta {
  id: string;
  atendenteId: string;
  nota: number;
  comentario?: string | null;
  periodo: string;
  dataAvaliacao: Date;
  avaliadorId?: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  atendente: AtendenteComUsuario;
}

export interface FeedbackCompleto {
  id: string;
  tipo: TipoFeedback;
  status: StatusFeedback;
  prioridade: PrioridadeFeedback;
  titulo: string;
  conteudo: string;
  autorId?: string | null;
  responsavelId?: string | null;
  resolucao?: string | null;
  dataResolucao?: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Tipos para criação de registros (sem campos auto-gerados)
export interface CriarUsuario {
  email: string;
  nome: string;
  senha: string;
  userType: TipoUsuario;
  ativo?: boolean;
}

export interface CriarAtendente {
  usuarioId: string;
  cpf: string;
  telefone: string;
  endereco?: string;
  dataAdmissao: Date;
  cargo: string;
  setor: string;
  salario?: number;
  status?: StatusAtendente;
  observacoes?: string;
}

export interface CriarAvaliacao {
  atendenteId: string;
  nota: number;
  comentario?: string;
  periodo: string;
  avaliadorId?: string;
}

export interface CriarFeedback {
  tipo: TipoFeedback;
  prioridade?: PrioridadeFeedback;
  titulo: string;
  conteudo: string;
  autorId?: string;
  responsavelId?: string;
}

// Tipos para atualização de registros
export interface AtualizarUsuario {
  email?: string;
  nome?: string;
  senha?: string;
  userType?: TipoUsuario;
  ativo?: boolean;
}

export interface AtualizarAtendente {
  cpf?: string;
  telefone?: string;
  endereco?: string;
  cargo?: string;
  setor?: string;
  salario?: number;
  status?: StatusAtendente;
  observacoes?: string;
}

export interface AtualizarFeedback {
  status?: StatusFeedback;
  prioridade?: PrioridadeFeedback;
  titulo?: string;
  conteudo?: string;
  responsavelId?: string;
  resolucao?: string;
  dataResolucao?: Date;
}

// Tipos para filtros e consultas
export interface FiltroUsuarios {
  userType?: TipoUsuario;
  ativo?: boolean;
  email?: string;
  nome?: string;
}

export interface FiltroAtendentes {
  status?: StatusAtendente;
  setor?: string;
  cargo?: string;
  dataAdmissaoInicio?: Date;
  dataAdmissaoFim?: Date;
}

export interface FiltroFeedbacks {
  tipo?: TipoFeedback;
  status?: StatusFeedback;
  prioridade?: PrioridadeFeedback;
  autorId?: string;
  responsavelId?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

// Tipos para paginação
export interface ParametrosPaginacao {
  pagina?: number;
  limite?: number;
  ordenarPor?: string;
  ordem?: 'asc' | 'desc';
}

export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
