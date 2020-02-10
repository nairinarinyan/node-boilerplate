import { ExpressErrorMiddlewareInterface, Middleware, HttpError } from "routing-controllers";
import { Request, Response } from "express";
import { Inject } from 'typedi';
import { Logger } from './logger';

interface DecoratedError extends Error {
    name: string;
    httpCode: number;
}

export class ApiError extends Error {
}

export class PermissionDeniedError extends ApiError implements DecoratedError {
    name = 'PermissionDeniedError'
    httpCode = 403;

    get message() {
        return super.message;
    }
}

export class InternalError extends ApiError implements DecoratedError {
    name = 'InternalError'
    httpCode = 500;

    get message() {
        return 'Internal error occured';
    }
}

export class GenericError extends ApiError implements DecoratedError {
    name = 'BadRequestError'
    httpCode = 400;

    get message() {
        return super.message;
    }
}


@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
    @Inject(type => Logger)
    private logger: Logger;

    error(error: DecoratedError, requst: Request, response: Response, next: () => void) {
        this.logger.error(error);

        const foreignError = !(error instanceof ApiError) && !(error instanceof HttpError);
        const errorToSend = foreignError ? new InternalError() : error;

        response.status(errorToSend.httpCode || 500).json({
            error: errorToSend.name,
            message: errorToSend.message
        });
    }
}