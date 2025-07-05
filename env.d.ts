/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PORT: string;
    readonly DB_TYPE: string;
    readonly RABBITMQ_URL: string;
    readonly DB_SOURCE: string;
    readonly REDIS_HOST: string;
    readonly REDIS_PORT: string;
    readonly REDIS_PASSWORD: string;
    readonly JWT_SECRET_KEY: string;
  }
}
