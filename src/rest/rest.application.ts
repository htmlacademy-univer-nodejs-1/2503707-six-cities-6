import express, { Express, Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { join, resolve } from 'node:path';
import { Logger } from '../shared/libs/logger/index.js';
import { Config, RestSchema } from '../shared/libs/config/index.js';
import { Component } from '../shared/types/index.js';
import { DatabaseClient } from '../shared/libs/database-client/index.js';
import { getMongoURI } from '../shared/helpers/index.js';
import { AppExceptionFilter, ExceptionFilter } from '../shared/libs/filters/index.js';
import { CommentController, OfferController, UserController } from '../shared/controllers/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

@injectable()
export class RestApplication {
  private expressApp: Express;
  private exceptionFilter: ExceptionFilter;
  private uploadDir: string;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
    @inject(Component.UserController) private readonly userController: UserController,
    @inject(Component.OfferController) private readonly offerController: OfferController,
    @inject(Component.CommentController) private readonly commentController: CommentController,
  ) {
    this.expressApp = express();
    this.exceptionFilter = new AppExceptionFilter(this.logger);

    this.uploadDir = resolve(this.config.get('UPLOAD_PATH'));
  }

  private _registerStaticFiles(): void {
    this.expressApp.use(
      '/static',
      express.static(this.uploadDir, {
        dotfiles: 'ignore',
        etag: true,
        index: false,
        maxAge: '1d',
        setHeaders: (res, path) => {
          if (/\.(jpeg|jpg|png|webp|gif)$/i.test(path)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
          }
        },
      })
    );
    this.logger.info(`Static files served from: ${this.uploadDir} at /static`);
  }

  private _registerControllers() {
    this.expressApp.use('/', this.userController.router);
    this.expressApp.use('/', this.offerController.router);
    this.expressApp.use('/comments', this.commentController.router);
  }

  private async _initDb() {
    const mongoUri = getMongoURI(
      this.config.get('DB_USER'),
      this.config.get('DB_PASSWORD'),
      this.config.get('DB_HOST'),
      this.config.get('DB_PORT'),
      this.config.get('DB_NAME'),
    );

    return this.databaseClient.connect(mongoUri);
  }

  private _registerMiddleware() {
    this.expressApp.use(cors({
      origin: true,
      credentials: true
    }));
    this.expressApp.use(express.json());
    this.expressApp.use(cookieParser());
    this.logger.info('Middleware registered: express.json(), cookieParser()');
  }

  private _registerExceptionFilters() {
    this.expressApp.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        this.exceptionFilter.catch(error, req, res, next);
      }
    );
    this.logger.info('Exception filter registered');
  }

  private async _startServer() {
    const port = this.config.get('PORT');

    this.expressApp.listen(port, () => {
      this.logger.info(`Server started on port ${port}`);
      this.logger.info(`Static files: http://localhost:${port}/static`);
    });
  }

  public async init() {
    this.logger.info(`Get value from env $PORT: ${this.config.get('PORT')}`);

    this.logger.info('Registering middleware…');
    this._registerMiddleware();

    this._registerStaticFiles();

    this._registerControllers();

    this.logger.info('Init database…');
    await this._initDb();

    this.logger.info('Registering exception filters…');
    this._registerExceptionFilters();

    this.logger.info('Starting Express server…');
    await this._startServer();
  }
}
