import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { Server as HttpServer, IncomingMessage } from 'http';
import { RequestHandler, Request, Response } from 'express';

import { Logger } from '../lib/logger';
import { PubSub, SubscriptionTopic } from '../lib/pub-sub';

import { User } from '../user/user.entity';

import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';

export enum MessageType {
    INIT = 'INIT',
    NOTIFICATION_UPDATED = 'NOTIFICATION_UPDATED',
}

@Service()
export class NotificationServer {
    private wss: WebSocketServer;
    private notificationSocketMap: Map<string, WebSocket[]> = new Map<string, WebSocket[]>()
    private sessionParser: RequestHandler;

    @Inject(type => Logger)
    private logger: Logger;

    @Inject(type => PubSub)
    pubSub: PubSub;

    @Inject(type => NotificationService)
    notificationService: NotificationService;

    @InjectRepository(User)
    private userRepository: Repository<User>;

    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>;

    init(server: HttpServer, sessionParser: RequestHandler) {
        this.sessionParser = sessionParser;

        this.wss = new WebSocket.Server({
            server,
            path: '/live/notifications',
            clientTracking: false
        });

        this.setupSubscription();
        this.wss.on('connection', (ws, req) =>  this.handleConnection(ws, req));

        this.logger.success('Notification server is up');
    }

    private setupSubscription() {
        this.pubSub.subscribe(SubscriptionTopic.NOTIFICATION_UPDATE, async (channel, message) => {
            const [type, userId] = channel.split(':');

            if (type !== 'notification') {
                return;
            }

            const user = await this.userRepository.findOne(userId);

            const subscriptionKey = user.id;
            const sockets = this.notificationSocketMap.get(subscriptionKey);

            if (!sockets || !sockets.length) {
                return;
            }

            const length = sockets.length;
            const payload = {
                type: MessageType.NOTIFICATION_UPDATED,
                notifications: JSON.parse(message)
            };

            const payloadToSend = JSON.stringify(payload);

            for (let i = 0; i < length; i++) {
                sockets[i].send(payloadToSend);
            }
        });
    }

    private async handleConnection(ws: WebSocket, req: IncomingMessage) {
        this.logger.info('Someone connected');
        const castedRequest = req as Request;

        this.sessionParser(castedRequest, {} as Response, async (err) => {
            const { userId } = castedRequest.session;

            if (err || !userId) {
                return ws.close(4000, JSON.stringify({ error: err ? err.toString() : 'Invalid user' }, null, 4));
            }

            const notifications = await this.notificationService.getLatest(userId);

            const initialMessage = {
                type: MessageType.INIT,
                notifications,
            };

            ws.send(JSON.stringify(initialMessage), err => {
                if (err) {
                    this.logger.error('Failed to send notifications' + err);
                }

                this.trackSocket(userId, ws);
            });

            ws.on('close', code => {
                this.removeSocket(userId, ws);
            });
        });
    }

    private trackSocket(memberId: string, socket: WebSocket) {
        const subscriptionKey = memberId;

        if (this.notificationSocketMap.get(subscriptionKey)) {
            this.notificationSocketMap.get(subscriptionKey).push(socket);
        } else {
            this.notificationSocketMap.set(subscriptionKey, [socket]);
        }
    }

    private removeSocket(memberId: string, socket: WebSocket) {
        const idx = this.notificationSocketMap.get(memberId).indexOf(socket);
        this.notificationSocketMap.get(memberId).splice(idx, 1);
    }
}