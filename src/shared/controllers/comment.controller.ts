import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController, Controller } from './index.js';
import asyncHandler from 'express-async-handler';
import { ValidateObjectIdMiddleware, ValidateDtoMiddleware, DocumentExistsMiddleware, AuthGuardMiddleware } from '../middlewares/index.js';
import { CreateCommentDto } from '../modules/comment/dto/create-comment.dto.js';
import { Component } from '../types/index.js';
import { OfferService } from '../modules/offer/index.js';
import { CommentService } from '../modules/comment/comment-service.interface.js';
import { JwtTokenService } from '../libs/JWT/jwt-token.service.js';

@injectable()
export class CommentController extends BaseController implements Controller {
  public router: Router;

  constructor(
    @inject(Component.CommentService) private readonly commentService: CommentService,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.JwtTokenService) private readonly jwtTokenService: JwtTokenService
  ) {
    super();
    this.router = Router();
    this._registerRoutes();
  }

  private _registerRoutes(): void {
    const validateObjectId = new ValidateObjectIdMiddleware('offerId');
    const validateCreateCommentDto = new ValidateDtoMiddleware(CreateCommentDto);
    const checkOfferExists = new DocumentExistsMiddleware('offerId', this.offerService);
    const authGuard = new AuthGuardMiddleware(this.jwtTokenService);

    this.registerRoute({
      path: '/:offerId',
      method: 'get',
      handler: asyncHandler((req: Request, res: Response) => this.index(req, res)),
      middlewares: [validateObjectId, checkOfferExists],
    });

    this.registerRoute({
      path: '/:offerId',
      method: 'post',
      handler: asyncHandler((req: Request, res: Response) => this.create(req, res)),
      middlewares: [validateObjectId, validateCreateCommentDto, authGuard, checkOfferExists],
    });
  }

  public async index(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const comments = await this.commentService.findByOfferId(offerId as string);
    this.sendOk(res, comments.map((comment) => this.toResponse(comment)));
  }

  public async create(req: Request, res: Response): Promise<void> {
    const offerId = req.params.offerId as string;
    const userId = req.user?.userId;

    const comment = await this.commentService.create({
      ...req.body,
      offerId,
      userId,
    });

    this.sendCreated(res, this.toResponse(comment));
  }

  private toResponse(comment: any) {
    const user = comment.userId ?? comment.user ?? {};

    return {
      id: comment.id ?? comment._id?.toString(),
      comment: comment.text,
      date: comment.postDate instanceof Date ? comment.postDate.toISOString() : comment.postDate,
      rating: comment.rating,
      user: {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar ?? user.avatarUrl,
        isPro: user.isPro,
      },
    };
  }
}
