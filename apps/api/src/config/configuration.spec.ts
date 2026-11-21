import { validateEnv } from './env.validation';

describe('Environment Configuration Validation', () => {
  it('should pass with defaults in development mode', () => {
    const config = validateEnv({});
    expect(config.NODE_ENV).toBe('development');
    expect(config.API_PORT).toBe(3000);
    expect(config.FRONTEND_ORIGIN).toBe('http://localhost:5173');
  });

  it('should parse custom port and origin correctly', () => {
    const config = validateEnv({
      API_PORT: '4000',
      FRONTEND_ORIGIN: 'http://example.com',
    });
    expect(config.API_PORT).toBe(4000);
    expect(config.FRONTEND_ORIGIN).toBe('http://example.com');
  });

  it('should throw an error for invalid port number', () => {
    expect(() => validateEnv({ API_PORT: 'invalid' })).toThrow(
      'Invalid API_PORT: invalid. Must be an integer between 1 and 65535.',
    );
    expect(() => validateEnv({ API_PORT: '999999' })).toThrow(
      'Invalid API_PORT: 999999. Must be an integer between 1 and 65535.',
    );
  });

  it('should throw an error for invalid NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow('Invalid NODE_ENV: staging.');
  });

  it('should fail in production if DATABASE_URL is missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: '',
      }),
    ).toThrow('DATABASE_URL is required in production mode.');
  });

  it('should pass in production when DATABASE_URL is provided', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/doomsday_ready',
    });
    expect(config.NODE_ENV).toBe('production');
    expect(config.DATABASE_URL).toBe(
      'postgresql://postgres:postgres@localhost:5432/doomsday_ready',
    );
  });
});

