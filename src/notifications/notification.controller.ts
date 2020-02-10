import { Controller, CurrentUser, BadRequestError, Put, Param, Delete } from 'routing-controllers';
import { Inject } from 'typedi';
import { Logger } from '../lib/logger';
import { NotificationService } from './notification.service';
import { User } from '../user/user.entity';

@Controller('/notifications')
export class NotificationController {
    @Inject(type => Logger)
    logger: Logger;

    @Inject(type => NotificationService)
    notificationService: NotificationService;

    @Put('/:id')
    async toggleNotification(
        @CurrentUser() currentUser: User,
        @Param('id') notificationId: string,
    ) {
        try {
            const notification = await this.notificationService.toggleNotification(notificationId, currentUser);
            return notification;
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestError(err);
        }
    }

    @Delete('/:id')
    async deleteNotification(
        @CurrentUser() currentUser: User,
        @Param('id') notificationId: string,
    ) {
        try {
            await this.notificationService.deleteNotification(notificationId, currentUser);
            return '';
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestError(err);
        }
    }
}
