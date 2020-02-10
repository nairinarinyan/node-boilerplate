import { Inject } from 'typedi';
import { Post, UseBefore, Body, Session, BadRequestError, Controller } from 'routing-controllers';
import { AuthService, SignupBody, LoginBody } from './auth.service';
import { authValidator } from './auth.validators';

@Controller()
export class AuthController {
    @Inject(type => AuthService)
    authService: AuthService;

    @Post('/signup')
    @UseBefore(authValidator.validateSignupBody)
    async signup(@Body() signupBody: SignupBody, @Session() session: Express.Session) {
        try {
            const user = await this.authService.signup(signupBody);
            session.userId = user.id;
            return '';
        } catch (err) {
            throw new BadRequestError(err.message);
        }
    }

    @Post('/login')
    @UseBefore(authValidator.validateLoginBody)
    async login(@Body() loginBody: LoginBody, @Session() session: Express.Session) {
        try {
            const user = await this.authService.login(loginBody);
            session.userId = user.id;
            return '';
        } catch (err) {
            throw new BadRequestError(err.message);
        }
    }

    @Post('/logout')
    async logout(@Session() session: Express.Session) {
        try {
            session.destroy(err => {
                if (err) {
                    throw err;
                }
            });
            return '';
        } catch (err) {
            throw new BadRequestError(err.message);
        }
    }
}