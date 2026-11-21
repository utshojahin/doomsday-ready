export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  API_PORT: number;
  DATABASE_URL: string;
  FRONTEND_ORIGIN: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const nodeEnv = (config.NODE_ENV as string) || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test.`);
  }

  const rawPort = config.API_PORT ?? 3000;
  const apiPort = Number(rawPort);
  if (isNaN(apiPort) || apiPort < 1 || apiPort > 65535) {
    throw new Error(`Invalid API_PORT: ${rawPort}. Must be an integer between 1 and 65535.`);
  }

  const databaseUrl = (config.DATABASE_URL as string) || '';
  if (nodeEnv === 'production' && !databaseUrl.trim()) {
    throw new Error('DATABASE_URL is required in production mode.');
  }

  const frontendOrigin = (config.FRONTEND_ORIGIN as string) || 'http://localhost:5173';

  return {
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
    API_PORT: apiPort,
    DATABASE_URL: databaseUrl,
    FRONTEND_ORIGIN: frontendOrigin,
  };
}

