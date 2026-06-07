import { inject, injectable } from 'inversify';
import { AuthService } from './auth.service.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType } from '@typegoose/typegoose';
import { UserEntity } from '../user/user.entity.js';
import { UserService } from '../user/user-service.interface.js';
import { JwtTokenService } from '../../libs/JWT/jwt-token.service.js';
import { createSHA256 } from '../../helpers/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';

@injectable()
export class DefaultAuthService implements AuthService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.JwtTokenService) private readonly jwtTokenService: JwtTokenService,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {}

  public async authenticate(user: DocumentType<UserEntity>): Promise<string> {
    const token = await this.jwtTokenService.generateToken(user._id.toString(), user.email);

    this.logger.info(`User ${user.email} authenticated successfully`);
    return token;
  }

  public async verify(token: string): Promise<DocumentType<UserEntity> | null> {
    const payload = await this.jwtTokenService.verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = await this.userService.findById(payload.userId);

    this.logger.info(`Token verification: ${user ? 'success' : 'failed'}`);
    return user;
  }

  public async login(email: string, password: string): Promise<DocumentType<UserEntity> | null> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.info(`Login failed: user ${email} not found`);
      return null;
    }

    const salt = this.config.get('SALT');
    const hashedPassword = createSHA256(password, salt);

    if (user.getPassword() !== hashedPassword) {
      this.logger.info(`Login failed: invalid password for user ${email}`);
      return null;
    }

    this.logger.info(`User ${email} logged in successfully`);
    return user;
  }

  public async logout(): Promise<void> {
    this.logger.info('User logged out');
  }

  public async getCurrentUser(token: string): Promise<DocumentType<UserEntity> | null> {
    return this.verify(token);
  }
}
