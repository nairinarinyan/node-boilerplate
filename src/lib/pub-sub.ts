import Container, { Service, Inject } from 'typedi';
import { createClient, RedisClient } from 'redis';
import uuid from 'uuid/v4';
import { redisConfigToken, RedisConfig } from '../config/redis';

export enum SubscriptionTopic {
    NOTIFICATION_UPDATE = 'notification:*'
}

type Callback = (channel: string, message: string) => void;

interface Subscriber {
    id: string;
    callback: Callback;
    unsubscribe: () => void;
}

@Service()
export class PubSub {
    private redisConfig: RedisConfig;

    private pub: RedisClient;
    private sub: RedisClient;

    private subscriptions: Map<SubscriptionTopic, Subscriber[]> = new Map<SubscriptionTopic, Subscriber[]>();

    constructor() {
        this.redisConfig = Container.get(redisConfigToken);

        this.pub = createClient({
            host: this.redisConfig.host
        });

        this.sub = createClient({
            host: this.redisConfig.host
        });

        this.sub.psubscribe(SubscriptionTopic.NOTIFICATION_UPDATE);

        this.sub.on('pmessage', (pattern, channel, message) => {
            const subscribers = this.subscriptions.get(pattern as SubscriptionTopic);

            subscribers.forEach(sub => {
               sub.callback(channel, message);
            });
        });
    }

    publish(memberId: string, payload: any) {
        const topic = `notification:${memberId}`;
        this.pub.publish(topic, JSON.stringify(payload));
    }

    subscribe(topic: SubscriptionTopic, callback: Callback): Subscriber {
        const id = uuid();
        const existingTopic = this.subscriptions.get(topic);

        const subscriber: Subscriber = {
            id,
            callback,
            unsubscribe: () => {}
        };

        if (existingTopic) {
            existingTopic.push(subscriber);
        } else {
            this.subscriptions.set(topic, [subscriber]);
        }

        return subscriber;
    }
}