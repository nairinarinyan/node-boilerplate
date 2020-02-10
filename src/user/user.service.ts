import Container, { Service, Inject } from 'typedi';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import fs from 'fs';
import sharp from 'sharp';
import { storageConfigToken, hostConfigToken } from '../config/config';
import { join } from 'path';

const { writeFile } = fs.promises;

export interface UpdateBody {
    name?: string;
}

export const normalizeAvatarPath = (user: User) => {
    if (!user) return null;

    const host = Container.get(hostConfigToken);

    if (user.avatar) {
        user.avatar = host + '/static/' + user.avatar;
    }

    return user;
};

@Service()
export class UserService {
    @InjectRepository(User)
    private userRepository: Repository<User>;

    @Inject(storageConfigToken)
    storagePath: string;

    @Inject(hostConfigToken)
    host: string;

    async getSelf(user: User) {
        return normalizeAvatarPath(user);
    }

    async updateProfile(user: User, updateBody: UpdateBody, avatarFile?: any) {
        console.log(avatarFile)
        console.log(updateBody);

        if (avatarFile) {
            const avatarPath = await this.processImage(user, avatarFile);
            user.avatar = avatarPath;
        }

        if (updateBody.name) {
            user.name = updateBody.name.trim();
        }

        await this.userRepository.save(user);
        return normalizeAvatarPath(user);
    }

    private async processImage(user: User, avatarFile: any) {
        try {
            const image = sharp(avatarFile.buffer);
            const buffer = await image.jpeg().resize(500).toBuffer();
    
            const storablePath = join('images/avatars',`${user.id}.jpg`);
            const path = join(this.storagePath, storablePath);
            await writeFile(path, buffer);

            return storablePath;
        } catch (err) {
            throw new Error('Failed to save user avatar');
        }
    }

}