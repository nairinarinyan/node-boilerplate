import { Service, Inject } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { PubSub } from '../lib/pub-sub';

import { User } from '../user/user.entity';
import { Notification } from './notification.entity';

@Service()
export class NotificationService {
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>;

    @Inject(type => PubSub)
    pubSub: PubSub;

    async toggleNotification(id: string, user: User) {
        await this.notificationRepository.query('UPDATE notification SET read = NOT read WHERE id = $1', [id]);
        this.sendLatest(user.id);
        return true;
    }

    async deleteNotification(id: string, user: User) {
        await this.notificationRepository.delete(id);
        this.sendLatest(user.id);
        return true;
    }

    async createNotification(body: string, user: User, link?: string) {
        const notification = this.notificationRepository.create({ body, link, user });

        await this.notificationRepository.save(notification);
        this.sendLatest(user.id);

        return notification;
    }


    async getLatest(userId: string) {
        return this.notificationRepository.createQueryBuilder('notification')
            .leftJoinAndSelect('notification.user', 'user')
            .where('user.id = :userId', { userId })
            .orderBy('date', 'DESC')
            .take(10)
            .getMany();
    }

    private async sendLatest(userId: string) {
        const notifications = await this.getLatest(userId);
        this.pubSub.publish(userId, notifications);
    }
}