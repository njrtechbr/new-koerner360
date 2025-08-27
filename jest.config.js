const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Caminho para o diretório do Next.js (pode ser relativo)
  dir: './',
});

// Configuração personalizada do Jest
const customJestConfig = {
  // Configurações de setup
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Ambiente de teste
  testEnvironment: 'jsdom',
  
  // Padrões de arquivos de teste
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Arquivos a serem ignorados
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Mapeamento de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/lib/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/lib/utils/$1',
    '^@/services/(.*)$': '<rootDir>/src/lib/services/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1',
  },
  
  // Extensões de arquivos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coleta de cobertura
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  
  // Diretório de cobertura
  coverageDirectory: 'coverage',
  
  // Relatórios de cobertura
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Limites de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Configurações de mock
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Configurações de verbose
  verbose: true,
  
  // Configurações de cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Configurações de workers
  maxWorkers: '50%',
};

// createJestConfig é exportado desta forma para garantir que next/jest possa carregar a configuração do Next.js que é assíncrona
module.exports = createJestConfig(customJestConfig);
