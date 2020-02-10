import ajv, { ValidateFunction, ErrorObject } from 'ajv';
import { Request, Response, NextFunction } from 'express';

export abstract class Validator {
    private ajv: ajv.Ajv;

    constructor() {
        this.ajv = new ajv({ allErrors: true, jsonPointers: true });
        this.init();
    }

    abstract init(): void;

    compile(schema: object) {
        return this.ajv.compile(schema);
    }

    protected validate(req: Request, res: Response, next: NextFunction, validateFn: ValidateFunction) {
        const isValid = validateFn(req.body);

        if (!isValid) {
            res.status(400).json(this.formatErrors(validateFn.errors));
        } else {
            next();
        }
    }

    formatErrors(errors: ErrorObject[]) {
        return errors.map(err => {
            return {
                field: err.dataPath.slice(1).replace('/', '.'),
                error: err.message,
                params: err.params
            };
        });
    }
}