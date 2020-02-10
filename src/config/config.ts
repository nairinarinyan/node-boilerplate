import Container, { Token } from 'typedi';
import { resolve } from 'path';

export enum Environment {
    DEV = 'DEV',
    TEST = 'TEST',
    PROD = 'PROD'
}

const environment = process.env.ENVIRONMENT as Environment || Environment.DEV;
export const environmentConfigToken = new Token<Environment>();

const port = parseInt(process.env.PORT) || 8000;
export const portConfigToken = new Token<number>();

const hostMap: { [env in keyof typeof Environment]: string } = {
    DEV: 'http://localhost:8000',
    TEST: 'change_this',
    PROD: 'change_this'
};

const host = hostMap[environment];
export const hostConfigToken = new Token<string>();

const storageMap: { [env in keyof typeof Environment]: string } = {
    DEV: resolve('./storage'),
    TEST: resolve('/opt/storage'),
    PROD: resolve('/opt/storage')
};

const storagePath = storageMap[environment];
export const storageConfigToken = new Token<string>();

Container.set(environmentConfigToken, environment);
Container.set(portConfigToken, port);
Container.set(hostConfigToken, host);
Container.set(storageConfigToken, storagePath);