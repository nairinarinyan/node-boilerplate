import { Transaction, TransactionManager, EntityManager, Repository } from 'typeorm';
import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User } from '../user/user.entity';
import { Logger } from '../lib/logger';

export interface SignupBody {
    email: string;
    password: string;
}

export interface LoginBody {
    email: string;
    password: string;
}

@Service()
export class AuthService {
    @InjectRepository(User)
    private userRepository: Repository<User>;

    constructor(
        private logger: Logger,
    ) {}

    @Transaction()
    async signup(singupBody: SignupBody, @TransactionManager() transactionManager?: EntityManager): Promise<User> {
        const { email, password } = singupBody;

        const existingUser = await this.userRepository.findOne({ email });

        if (!existingUser) {
            throw new BadRequestError('User exists');
        }

        try {
            const user = transactionManager.create(User, { email });
            await user.setPassword(password);
            await transactionManager.save(user);
            return user;
        } catch (err) {
            this.logger.error(err);
            throw new Error();
        }
    }

    async login(loginBody: LoginBody): Promise<User> {
        const { email, password } = loginBody;

        const user = await this.userRepository.createQueryBuilder('user')
            .select(['user.passwordHash', 'user.id'])
            .where('user.email = :email', { email })
            .getOne();

        if (!user) {
            throw new Error('Wrong credentials');
        }

        const validPassword = await user.validatePassword(password, user.passwordHash);

        if (!validPassword) {
            throw new Error('Wrong credentials');
        } else {
            delete user.passwordHash;
            return user;
        }
    }
}