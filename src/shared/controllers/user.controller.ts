import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController, Controller } from './index.js';
import asyncHandler from 'express-async-handler';
import { ValidateObjectIdMiddleware, ValidateDtoMiddleware, DocumentExistsMiddleware, AuthGuardMiddleware } from '../middlewares/index.js';
import { CreateUserDto } from '../modules/user/dto/create-user.dto.js';
import { LoginUserDto } from '../modules/user/dto/login-user.dto.js';
import { Component } from '../types/index.js';
import { UserService } from '../modules/user/user-service.interface.js';
import { Config, RestSchema } from '../libs/config/index.js';
import { FileUploadMiddleware } from '../middlewares/file-upload.middleware.js';
import { JwtTokenService } from '../libs/JWT/jwt-token.service.js';
import { AuthService } from '../modules/auth/auth.service.interface.js';

@injectable()
export class UserController extends BaseController implements Controller {
  public router: Router;
  private readonly avatarUpload: FileUploadMiddleware;

  constructor(
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.JwtTokenService) private readonly jwtTokenService: JwtTokenService,
    @inject(Component.AuthService) private readonly authService: AuthService
  ) {
    super();
    this.router = Router();

    this.avatarUpload = FileUploadMiddleware.forAvatar(this.config.get('UPLOAD_PATH'));

    this._registerRoutes();
  }

  private _registerRoutes(): void {
    const validateObjectId = new ValidateObjectIdMiddleware('userId');
    const validateCreateUserDto = new ValidateDtoMiddleware(CreateUserDto);
    const validateLoginUserDto = new ValidateDtoMiddleware(LoginUserDto);
    const checkUserExists = new DocumentExistsMiddleware('userId', this.userService);
    const authGuard = new AuthGuardMiddleware(this.jwtTokenService);

    this.registerRoute({
      path: '/register',
      method: 'post',
      handler: asyncHandler((req, res) => this.create(req, res)),
      middlewares: [validateCreateUserDto],
    });

    this.registerRoute({
      path: '/login',
      method: 'post',
      handler: asyncHandler((req, res) => this.login(req, res)),
      middlewares: [validateLoginUserDto],
    });

    this.registerRoute({
      path: '/logout',
      method: 'post',
      handler: asyncHandler((req, res) => this.logout(req, res)),
      middlewares: [authGuard],
    });

    this.registerRoute({
      path: '/profile',
      method: 'get',
      handler: asyncHandler((req, res) => this.show(req, res)),
      middlewares: [authGuard],
    });

    this.registerRoute({
      path: '/:userId/avatar',
      method: 'post',
      handler: asyncHandler((req, res) => this.uploadAvatar(req, res)),
      middlewares: [
        validateObjectId,
        checkUserExists,
        authGuard,
        this.avatarUpload,
      ],
    });
  }

  public async uploadAvatar(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    const filename = req.file!.filename;

    const updatedUser = await this.userService.updateAvatar(userId as string, filename);

    const avatarUrl = `/static/avatars/${filename}`;

    this.sendCreated(res, {
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user: {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    const dto: CreateUserDto = req.body;
    const salt = this.config.get('SALT');

    const user = await this.userService.create(dto, salt);

    this.sendCreated(res, {
      id: user.id ?? user._id?.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar,
      isPro: user.isPro,
    });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const dto: LoginUserDto = req.body;
    const user = await this.authService.login(dto.email, dto.password);

    if (!user) {
      this.sendNotFound(res, 'Invalid credentials');
      return;
    }

    const token = await this.authService.authenticate(user);

    // Set HTTP-only cookie
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure });

    this.sendOk(res, { message: 'Authenticated' });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    this.sendOk(res, { message: 'Logged out successfully' });
  }

  public async show(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'Invalid or missing token');
      return;
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      this.sendNotFound(res, 'User not found');
      return;
    }

    this.sendOk(res, user);
  }
}
