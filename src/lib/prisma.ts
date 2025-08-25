import { PrismaClient } from '../generated/prisma';
import {
  buildDatabaseUrl,
  getLogConfig,
  createConnectionPoolMonitor,
  validateDatabaseConfig,
} from './database-config';

// Declaração global para evitar múltiplas instâncias em desenvolvimento
declare global {
  var prisma: PrismaClient | undefined;
  var connectionMonitor:
    | ReturnType<typeof createConnectionPoolMonitor>
    | undefined;
}

// Validar configurações antes de inicializar
const configValidation = validateDatabaseConfig();
if (!configValidation.valid) {
  console.error('❌ Configuração de banco inválida:', configValidation.errors);
  throw new Error(
    `Configuração de banco inválida: ${configValidation.errors.join(', ')}`
  );
}

// Monitor de conexões (apenas em desenvolvimento)
const connectionMonitor =
  globalThis.connectionMonitor ||
  (process.env.NODE_ENV === 'development'
    ? createConnectionPoolMonitor()
    : null);

if (process.env.NODE_ENV === 'development') {
  globalThis.connectionMonitor = connectionMonitor;
}

// Configuração do cliente Prisma com otimizações e connection pooling
const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: getLogConfig() as any,
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

// Em desenvolvimento, reutilizar a instância para evitar múltiplas conexões
if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

// Exportar o cliente como padrão e nomeado
export default prisma;
export { prisma };

// Função para desconectar do banco
export const disconnect = async () => {
  try {
    await prisma.$disconnect();
    console.log('🔌 Desconectado do banco de dados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao desconectar do banco:', error);
  }
};

// Função para verificar a conexão com o banco
export const checkDatabaseConnection = async () => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    const duration = Date.now() - startTime;

    return {
      success: true,
      message: 'Conexão com o banco de dados estabelecida com sucesso',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao conectar com o banco de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    };
  }
};

// Função para obter estatísticas do pool de conexões
export const getConnectionPoolStats = () => {
  if (connectionMonitor) {
    return connectionMonitor.getStats();
  }

  return {
    message: 'Monitor de conexões não disponível neste ambiente',
    environment: process.env.NODE_ENV || 'unknown',
  };
};

// Função para executar health check completo
export const performHealthCheck = async () => {
  const healthCheck = {
    database: await checkDatabaseConnection(),
    connectionPool: getConnectionPoolStats(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  return healthCheck;
};

// Função para executar query com monitoramento de performance
export const executeWithMonitoring = async <T>(
  queryFn: () => Promise<T>,
  queryName: string = 'unknown'
): Promise<{ result: T; duration: number; queryName: string }> => {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`🐌 Query lenta detectada: ${queryName} (${duration}ms)`);
    }

    return { result, duration, queryName };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro na query: ${queryName} (${duration}ms)`, error);
    throw error;
  }
};
