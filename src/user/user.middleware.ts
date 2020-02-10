import { Action } from 'routing-controllers';
import { getRepository } from 'typeorm';
import { User } from './user.entity';

export const currentUserChecker = async (action: Action) => {
    const userRepository = getRepository(User);
    const { userId } = action.request.session;

    try {
        return userRepository.findOne({ id: userId });
    } catch (err) {
        console.error(err);
    }
};