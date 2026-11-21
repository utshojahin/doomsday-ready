import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
}));

