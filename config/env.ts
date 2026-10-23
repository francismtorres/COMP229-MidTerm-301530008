const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV)[number];

export interface AppEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
}

export function loadEnv(): AppEnv {
  const missing = REQUIRED_ENV.filter((key: RequiredEnvVar) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Copy .env.example to .env and fill it in.`
    );
  }

  const nodeEnv = process.env.NODE_ENV;
  const resolvedNodeEnv: AppEnv['NODE_ENV'] =
    nodeEnv === 'production' || nodeEnv === 'test' ? nodeEnv : 'development';

  const port = Number(process.env.PORT) || 8080;

  return {
    NODE_ENV: resolvedNodeEnv,
    PORT: port,
    MONGODB_URI: process.env.MONGODB_URI as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
  };
}
