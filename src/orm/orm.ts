import { Service, Inject } from 'typedi';
import { createConnection } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { postgresConfigToken, PostgresConfig } from '../config/postgres';

import { User } from '../user/user.entity';
import { Notification  } from '../notifications/notification.entity';

@Service()
export class Orm {
    @Inject(postgresConfigToken)
    postgresConfig: PostgresConfig;

    async init() {
        const { host, database, username, password } = this.postgresConfig;

        const connectionOptions: PostgresConnectionOptions = {
            type: 'postgres',
            host, database, username, password,
            entities:[
                User, Notification,
            ],
            synchronize: true,
            extra: {
                max: 100
            },
        };

        await createConnection(connectionOptions);
    }
}
