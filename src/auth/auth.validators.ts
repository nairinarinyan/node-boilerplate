import { ValidateFunction } from 'ajv';
import { Request, Response, NextFunction } from 'express';
import { Validator } from '../lib/validator';

export class AuthValidator extends Validator {
    private loginSchema: object;
    private signupSchema: object;
    private validateSignup: ValidateFunction;
    private validateLogin: ValidateFunction;

    init() {
        this.signupSchema = {
            type: 'object',
            required: ['email', 'password'],
            additionalProperties: false,
            properties: {
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: 3
                }
            }
        };

        this.loginSchema = {
            type: 'object',
            required: ['email', 'password'],
            additionalProperties: false,
            properties: {
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: 3
                }
            }
        };

        this.validateSignup = this.compile(this.signupSchema);
        this.validateLogin = this.compile(this.loginSchema);
    }

    validateSignupBody = (req: Request, res: Response, next: NextFunction) => {
        this.validate(req, res, next, this.validateSignup);
    }

    validateLoginBody = (req: Request, res: Response, next: NextFunction) => {
        this.validate(req, res, next, this.validateLogin);
    }
}

export const authValidator = new AuthValidator();