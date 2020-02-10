import { NextFunction, Response, Request } from "express";
import { getRepository } from "typeorm";
import { User } from "../user/user.entity";
import { Action } from "routing-controllers";

export interface EnhancedRequest extends Request {
    user: User;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const userRespository = getRepository(User);

    if (!req.session.userId) {
        return res.status(401).end();
    }

    const user = await userRespository.findOne({ id: req.session.userId });

    if (user) {
        (req as EnhancedRequest).user = user;
        next();
    } else {
        return res.status(401).end();
    }
};

export const authorizationChecker = async (action: Action, roles: string[]) => {
    const userRespository = getRepository(User);

    const { userId } = action.request.session;

    if (!userId) {
        return false;
    }

    const user = await userRespository.findOne({ id: userId });

    if (user) {
        return true;
    } else {
        return false;
    }
};