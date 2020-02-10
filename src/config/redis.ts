import Container, { Token } from 'typedi';

export interface RedisConfig {
    host: string;
}

const redisConfig: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost'
};

export const redisConfigToken = new Token<RedisConfig>();
Container.set(redisConfigToken, redisConfig);