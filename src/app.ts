import 'reflect-metadata';
import Container, { Inject, Service } from 'typedi';
import {useContainer as ormUseContainer} from 'typeorm';
import redis from 'redis';
import { Server } from 'http';
import express, { Express, RequestHandler } from 'express';
import { URL } from 'url';
import { useExpressServer, useContainer as routingUseContainer } from 'routing-controllers';
import session, { Store } from 'express-session';
import connectRedis, { RedisStoreOptions }  from 'connect-redis';
import bodyParser from 'body-parser';
import expressWinston from 'express-winston';
import winston from 'winston';

import { portConfigToken, storageConfigToken, hostConfigToken } from './config/config';
import { redisConfigToken, RedisConfig } from './config/redis';

import { Orm } from './orm/orm';
import { Logger } from './lib/logger';

import { authorizationChecker } from './auth/auth.middleware';
import { currentUserChecker } from './user/user.middleware';
import { ErrorHandler } from './lib/error-handler';

import { AuthController } from './auth/auth.controller';
import { NotificationServer } from './notifications/notification.server';
import { NotificationController } from './notifications/notification.controller';

routingUseContainer(Container);
ormUseContainer(Container);

@Service()
class App {
    @Inject(portConfigToken)
    private port: number;

    @Inject(redisConfigToken)
    private redisConfig: RedisConfig;

    @Inject(hostConfigToken)
    private host: string;

    @Inject(storageConfigToken)
    private storagePath: string;

    @Inject(type => Logger)
    private logger: Logger;

    @Inject(type => Orm)
    private orm: Orm;

    private expressApp: Express = express();

    private setUpRedisStore(): Store {
        const client = redis.createClient({
            host: this.redisConfig.host
        });

        client.on('error', err => {
            this.logger.error(err);
            process.exit(1);
        });

        const RedisStore = connectRedis(session);
        const redisStoreOptions: RedisStoreOptions = {
            client,
            logErrors: true
        };

        return new RedisStore(redisStoreOptions)
    }

    private setupMiddleware(): RequestHandler {
        const { expressApp } = this;
        const redisStore = this.setUpRedisStore();

        const month = 30 * 24 * 60 * 60 * 1000;

        const sessionParser = session({
            store: redisStore,
            secret: 'foobar',
            resave: false,
            saveUninitialized: false,
            cookie: {
                domain: new URL(this.host).hostname,
                expires: new Date(Date.now() + month)
            }
        });

        expressApp.set('trust proxy', 1);
        expressApp.use('/', sessionParser);

        expressApp.use(bodyParser.urlencoded({ extended: false }));
        expressApp.use(bodyParser.json());

        return sessionParser;
    }

    private setupLogger() {
        const logger = winston.createLogger({
            transports: [
                new winston.transports.Console()
            ],
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        });

        expressWinston.requestWhitelist.push('body');

        this.expressApp.use(expressWinston.logger({
            winstonInstance: logger,
            colorize: true
        }));
    }

    private setupControllers() {
        useExpressServer(this.expressApp, {
            routePrefix: '/api',
            authorizationChecker,
            currentUserChecker,
            controllers: [
                AuthController,
                NotificationController,
            ],
            middlewares: [ErrorHandler],
            defaultErrorHandler: false
        });
    }

    private initNotificationServer(server: Server, sessionParser: RequestHandler) {
        const notificationServer = Container.get(NotificationServer);
        notificationServer.init(server, sessionParser);
    }

    private setupStaticServer() {
        this.expressApp.use('/static', express.static(this.storagePath));
        this.logger.success('Serving static files');
    }

    async start() {
        try {
            await this.orm.init();
            this.logger.success('Init ORM')
        } catch (err) {
            this.logger.error(err);
            process.exit(1);
        }

        const sessionParser = this.setupMiddleware();
        this.setupLogger();
        this.setupControllers();
        this.setupStaticServer();

        const server = this.expressApp.listen(this.port, '0.0.0.0', () => {
            this.logger.success('Server is up on ' + this.port);
        });

        this.initNotificationServer(server, sessionParser);
    }
}

const app = Container.get(App);
app.start();
