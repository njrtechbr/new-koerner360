/**
 * Configurações avançadas de banco de dados e connection pooling
 */

export interface DatabaseConfig {
  connectionLimit: number;
  poolTimeout: number;
  connectTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  enableQueryLogging: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number;
}

// Configurações por ambiente
const configs: Record<string, DatabaseConfig> = {
  development: {
    connectionLimit: 10,
    poolTimeout: 20, // segundos
    connectTimeout: 60, // segundos
    idleTimeout: 300, // 5 minutos
    maxLifetime: 3600, // 1 hora
    enableQueryLogging: true,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 segundo
  },

  test: {
    connectionLimit: 5,
    poolTimeout: 10,
    connectTimeout: 30,
    idleTimeout: 60, // 1 minuto
    maxLifetime: 600, // 10 minutos
    enableQueryLogging: false,
    enableSlowQueryLogging: false,
    slowQueryThreshold: 5000,
  },

  production: {
    connectionLimit: 20,
    poolTimeout: 30,
    connectTimeout: 60,
    idleTimeout: 600, // 10 minutos
    maxLifetime: 7200, // 2 horas
    enableQueryLogging: false,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 2000, // 2 segundos
  },
};

/**
 * Obtém a configuração do banco de dados baseada no ambiente
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  const env = process.env.NODE_ENV || 'development';
  return configs[env] || configs.development;
};

/**
 * Constrói a URL de conexão com parâmetros de connection pooling
 */
export const buildDatabaseUrl = (baseUrl?: string): string => {
  const config = getDatabaseConfig();
  const url = baseUrl || process.env.DATABASE_URL || '';

  // Se a URL já contém parâmetros de pooling, retorna como está
  if (url.includes('connection_limit=')) {
    return url;
  }

  // Adiciona parâmetros de connection pooling
  const separator = url.includes('?') ? '&' : '?';
  const poolingParams = [
    `connection_limit=${config.connectionLimit}`,
    `pool_timeout=${config.poolTimeout}`,
    `connect_timeout=${config.connectTimeout}`,
    'sslmode=prefer',
  ].join('&');

  return `${url}${separator}${poolingParams}`;
};

/**
 * Configurações de log baseadas no ambiente e configuração
 */
export const getLogConfig = () => {
  const config = getDatabaseConfig();
  const env = process.env.NODE_ENV || 'development';

  if (!config.enableQueryLogging) {
    return ['error'];
  }

  switch (env) {
    case 'development':
      return ['query', 'info', 'warn', 'error'];
    case 'test':
      return ['error'];
    case 'production':
      return ['warn', 'error'];
    default:
      return ['error'];
  }
};

/**
 * Middleware para logging de queries lentas
 */
export const createSlowQueryLogger = () => {
  const config = getDatabaseConfig();

  if (!config.enableSlowQueryLogging) {
    return null;
  }

  return {
    beforeRequest: (params: any) => {
      params.startTime = Date.now();
    },
    afterRequest: (params: any) => {
      const duration = Date.now() - params.startTime;

      if (duration > config.slowQueryThreshold) {
        console.warn(`🐌 Query lenta detectada (${duration}ms):`, {
          query: params.query,
          duration: `${duration}ms`,
          threshold: `${config.slowQueryThreshold}ms`,
        });
      }
    },
  };
};

/**
 * Configurações de retry para conexões
 */
export const getRetryConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  return {
    retries: env === 'production' ? 3 : 1,
    retryDelay: 1000, // 1 segundo
    maxRetryDelay: 5000, // 5 segundos
  };
};

/**
 * Monitora o status do pool de conexões
 */
export const createConnectionPoolMonitor = () => {
  let activeConnections = 0;
  let totalConnections = 0;

  return {
    onConnect: () => {
      activeConnections++;
      totalConnections++;

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📊 Pool de conexões: ${activeConnections} ativas, ${totalConnections} total`
        );
      }
    },

    onDisconnect: () => {
      activeConnections--;

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📊 Pool de conexões: ${activeConnections} ativas, ${totalConnections} total`
        );
      }
    },

    getStats: () => ({
      activeConnections,
      totalConnections,
      config: getDatabaseConfig(),
    }),
  };
};

/**
 * Configurações de health check para o banco
 */
export const getHealthCheckConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  return {
    enabled: true,
    interval: env === 'production' ? 30000 : 60000, // 30s prod, 60s dev
    timeout: 5000, // 5 segundos
    retries: 3,
    query: 'SELECT 1 as health_check',
  };
};

/**
 * Utilitário para validar configurações de ambiente
 */
export const validateDatabaseConfig = (): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL não está definida');
  }

  const config = getDatabaseConfig();

  if (config.connectionLimit < 1) {
    errors.push('connectionLimit deve ser maior que 0');
  }

  if (config.poolTimeout < 1) {
    errors.push('poolTimeout deve ser maior que 0');
  }

  if (config.connectTimeout < 1) {
    errors.push('connectTimeout deve ser maior que 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default {
  getDatabaseConfig,
  buildDatabaseUrl,
  getLogConfig,
  createSlowQueryLogger,
  getRetryConfig,
  createConnectionPoolMonitor,
  getHealthCheckConfig,
  validateDatabaseConfig,
};
