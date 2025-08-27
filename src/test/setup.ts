// Setup para Jest e Vitest
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Detectar ambiente de teste
const isVitest = typeof global.vitest !== 'undefined' || process.env.VITEST === 'true';
const isJest = typeof jest !== 'undefined';

// Configurar mocks baseado no ambiente
const mockFn = isVitest ? (global as any).vi?.fn || (() => {}) : jest.fn;
const clearMocks = isVitest ? (global as any).vi?.clearAllMocks || (() => {}) : jest.clearAllMocks;

// Limpar após cada teste
afterEach(() => {
  cleanup();
  if (isVitest && (global as any).vi) {
    (global as any).vi.clearAllMocks();
  } else if (isJest) {
    jest.clearAllMocks();
  }
});

// Mock do fetch global
if (isVitest) {
  if ((global as any).vi) {
    global.fetch = (global as any).vi.fn();
  }
} else {
  global.fetch = jest.fn();
}

// Mock do localStorage
const localStorageMock = {
  getItem: mockFn(),
  setItem: mockFn(),
  removeItem: mockFn(),
  clear: mockFn(),
  length: 0,
  key: mockFn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: mockFn(),
  setItem: mockFn(),
  removeItem: mockFn(),
  clear: mockFn(),
  length: 0,
  key: mockFn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock do window.location
if (!window.location || typeof window.location.assign === 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: mockFn(),
      replace: mockFn(),
      reload: mockFn(),
    },
    writable: true,
    configurable: true,
  });
}

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockFn().mockImplementation ? mockFn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: mockFn(), // deprecated
    removeListener: mockFn(), // deprecated
    addEventListener: mockFn(),
    removeEventListener: mockFn(),
    dispatchEvent: mockFn(),
  })) : () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock do ResizeObserver
global.ResizeObserver = mockFn().mockImplementation ? mockFn().mockImplementation(() => ({
  observe: mockFn(),
  unobserve: mockFn(),
  disconnect: mockFn(),
})) : class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock do IntersectionObserver
global.IntersectionObserver = mockFn().mockImplementation ? mockFn().mockImplementation(() => ({
  observe: mockFn(),
  unobserve: mockFn(),
  disconnect: mockFn(),
})) : class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock do console para testes mais limpos (apenas para Jest)
if (isJest) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
}

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// Helpers para testes
export const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: mockFn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  } as Response;
};

export const createMockFetch = (responses: any[]) => {
  let callCount = 0;
  return mockFn().mockImplementation ? mockFn().mockImplementation(() => {
    const response = responses[callCount] || responses[responses.length - 1];
    callCount++;
    return Promise.resolve(createMockResponse(response));
  }) : () => Promise.resolve(createMockResponse(responses[0] || {}));
};

export const createMockToast = () => ({
  toast: mockFn(),
  success: mockFn(),
  error: mockFn(),
  warning: mockFn(),
  info: mockFn(),
  loading: mockFn(),
  dismiss: mockFn(),
});

// Mock de dados comuns para testes
export const mockUsuario = {
  id: 'user1',
  nome: 'João Silva',
  email: 'joao@empresa.com',
  cargo: 'Desenvolvedor',
  departamento: 'TI',
  ativo: true,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
};

export const mockAvaliacao = {
  id: 'aval1',
  titulo: 'Avaliação Anual 2024',
  descricao: 'Avaliação de desempenho anual',
  tipo: 'anual',
  status: 'pendente',
  prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  usuarioId: 'user1',
  avaliadorId: 'user2',
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

export const mockNotificacao = {
  id: 'notif1',
  usuarioId: 'user1',
  avaliacaoId: 'aval1',
  tipo: 'pendente',
  titulo: 'Avaliação Pendente',
  mensagem: 'Você tem uma avaliação pendente para completar.',
  urgencia: 'media',
  lida: false,
  criadaEm: new Date().toISOString(),
  leituraEm: null,
};

export const mockLembrete = {
  id: 'lembrete1',
  usuarioId: 'user1',
  avaliacaoId: 'aval1',
  tipo: 'prazo_vencimento',
  titulo: 'Lembrete de Prazo',
  mensagem: 'Sua avaliação vence em 3 dias.',
  dataEnvio: new Date().toISOString(),
  status: 'pendente',
  tentativas: 0,
  ultimaTentativa: null,
  erro: null,
  metadados: {
    nomeAvaliacao: 'Avaliação Anual 2024',
    diasAntecedencia: 3,
  },
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
};

// Utilitários para testes assíncronos
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Mock de hooks do Next.js para Jest
if (isJest) {
  jest.mock('next/router', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }),
  }));

  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }));
}