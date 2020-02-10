import { Service } from 'typedi';
import { getRepository, Repository } from 'typeorm';
import { User } from './user.entity';

@Service()
class UserRepository  {
    private userRepository: Repository<User>;

    constructor() {

        this.userRepository = getRepository(User);
    }
}