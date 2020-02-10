import Container, { Token } from 'typedi';
import { readSecret } from '../lib/secrets';

export interface PostgresConfig {
    host: string;
    database: string;
    username:string;
    password: string;
}

const postgresConfig: PostgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || readSecret('postgres_db') || 'change_this',
    username: process.env.POSTGRES_USER || readSecret('postgres_user')|| 'change_this',
    password: process.env.POSTGRES_PASSWORD || readSecret('postgres_password')|| 'change_this'
};

export const postgresConfigToken = new Token<PostgresConfig>();
Container.set(postgresConfigToken, postgresConfig);