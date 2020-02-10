import { Controller, Get, CurrentUser, BadRequestError, Put, Body, UploadedFile } from 'routing-controllers';
import { UserService, UpdateBody } from './user.service';
import { Logger } from '../lib/logger';
import { User } from './user.entity';
import multer from 'multer';

const getUploadOptions = {
    storage: multer.memoryStorage(),
    limits: {
        fieldNameSize: 255,
        fileSize: 1024 * 1024 * 20
    }
};

@Controller('/users')
export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger
    ) {}

    @Get('/me')
    identity(@CurrentUser({ required: true }) currentUser: User) {
        return this.userService.getSelf(currentUser);
    }

    @Put('/me')
    async updateProfile(
        @CurrentUser({ required: true }) currentUser: User,
        @UploadedFile('avatar', { options: getUploadOptions }) file: any,
        @Body() updateBody: UpdateBody
    ) {
        try {
            const updatedProfile = this.userService.updateProfile(currentUser, updateBody, file);
            return updatedProfile;
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestError(err);
        }
    }
}