import { Signale } from 'signale';
import { Service } from 'typedi';

@Service()
export class Logger {
    private logger: Signale;

    constructor() {
        const options = {
            types:{
                success: {
                    label: '',
                }
            }
        };

        this.logger = new Signale(options as any);
    }

    log(message: any) {
        this.logger.log(message);
    }

    info(message: string) {
        this.logger.info(message);
    }

    success(message: string) {
        this.logger.success(message);
    }

    warn(message: string | Error) {
        this.logger.warn(message);
    }

    error(error: string | Error) {
        this.logger.error(error);
    }
}