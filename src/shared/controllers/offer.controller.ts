import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController, Controller } from './index.js';
import asyncHandler from 'express-async-handler';
import { OfferEntity, OfferService } from '../modules/offer/index.js';
import { AuthGuardMiddleware, DocumentExistsMiddleware, ValidateDtoMiddleware, ValidateObjectIdMiddleware } from '../middlewares/index.js';
import { CreateOfferDto } from '../modules/offer/dto/create-offer.dto.js';
import { UpdateOfferDto } from '../modules/offer/dto/update-offer.dto.js';
import { Component } from '../types/index.js';
import { JwtTokenService } from '../libs/JWT/jwt-token.service.js';

const CITY_LOCATION: Record<string, { latitude: number; longitude: number }> = {
  Paris: { latitude: 48.85661, longitude: 2.351499 },
  Cologne: { latitude: 50.938361, longitude: 6.959974 },
  Brussels: { latitude: 50.846557, longitude: 4.351697 },
  Amsterdam: { latitude: 52.37454, longitude: 4.897976 },
  Hamburg: { latitude: 53.550341, longitude: 10.000654 },
  Dusseldorf: { latitude: 51.225402, longitude: 6.776313 },
};

@injectable()
export class OfferController extends BaseController implements Controller {
  public router: Router;

  constructor(
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.JwtTokenService) private readonly jwtTokenService: JwtTokenService
  ) {
    super();
    this.router = Router();
    this._registerRoutes();
  }

  private _registerRoutes(): void {
    const validateObjectId = new ValidateObjectIdMiddleware('offerId');
    const validateCreateOfferDto = new ValidateDtoMiddleware(CreateOfferDto);
    const validateUpdateOfferDto = new ValidateDtoMiddleware(UpdateOfferDto);
    const checkOfferExists = new DocumentExistsMiddleware('offerId', this.offerService);
    const authGuard = new AuthGuardMiddleware(this.jwtTokenService);

    // GET /hotels
    this.registerRoute({
      path: '/hotels',
      method: 'get',
      handler: asyncHandler((req, res) => this.index(req, res)),
    });

    // POST /hotels
    this.registerRoute({
      path: '/hotels',
      method: 'post',
      handler: asyncHandler((req, res) => this.create(req, res)),
      middlewares: [validateCreateOfferDto, authGuard],
    });

    // GET /premium
    this.registerRoute({
      path: '/premium',
      method: 'get',
      handler: asyncHandler((req, res) => this.getPremiumOffers(req, res)),
    });

    // GET /favorite
    this.registerRoute({
      path: '/favorite',
      method: 'get',
      handler: asyncHandler((req, res) => this.getFavoriteOffers(req, res)),
      middlewares: [authGuard]
    });

    // POST /favorite/:offerId/:status
    this.registerRoute({
      path: '/favorite/:offerId/:status',
      method: 'post',
      handler: asyncHandler((req, res) => this.toggleFavorite(req, res)),
      middlewares: [validateObjectId, authGuard, checkOfferExists],
    });

    // DELETE /favorite/:offerId
    this.registerRoute({
      path: '/favorite/:offerId',
      method: 'delete',
      handler: asyncHandler((req, res) => this.removeFromFavorite(req, res)),
      middlewares: [validateObjectId, authGuard, checkOfferExists],
    });

    // GET /hotels/:offerId
    this.registerRoute({
      path: '/hotels/:offerId',
      method: 'get',
      handler: asyncHandler((req, res) => this.show(req, res)),
      middlewares: [validateObjectId, checkOfferExists],
    });

    // PATCH /hotels/:offerId
    this.registerRoute({
      path: '/hotels/:offerId',
      method: 'patch',
      handler: asyncHandler((req, res) => this.update(req, res)),
      middlewares: [validateObjectId, validateUpdateOfferDto, authGuard, checkOfferExists],
    });

    // DELETE /hotels/:offerId
    this.registerRoute({
      path: '/hotels/:offerId',
      method: 'delete',
      handler: asyncHandler((req, res) => this.delete(req, res)),
      middlewares: [validateObjectId, authGuard, checkOfferExists],
    });
  }


  public async index(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? Number(req.query.limit) : 60;
    const offers = await this.offerService.find(limit);
    this.sendOk(res, offers.map((offer) => this.toResponse(offer)));
  }

  public async create(req: Request, res: Response): Promise<void> {
    const offerData: CreateOfferDto = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const newOffer = await this.offerService.create(offerData, userId);

    this.sendCreated(res, this.toResponse(newOffer));
  }

  public async show(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const offer = await this.offerService.findById(offerId as string);

    if (!offer) {
      this.sendNotFound(res, 'Offer not found');
      return;
    }

    this.sendOk(res, this.toResponse(offer));
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const updateData: UpdateOfferDto = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const offer = await this.offerService.findById(offerId as string);
    if (!offer) {
      this.sendNotFound(res, 'Offer not found');
      return;
    }

    if (offer.authorId._id.toString() !== userId) {
      this.sendForbidden(res, 'You can only update your own offers');
      return;
    }

    const updatedOffer = await this.offerService.updateById(offerId as string, updateData);
    this.sendOk(res, updatedOffer ? this.toResponse(updatedOffer) : null);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const offer = await this.offerService.findById(offerId as string);
    if (!offer) {
      this.sendNotFound(res, 'Offer not found');
      return;
    }

    if (offer.authorId.toString() !== userId) {
      this.sendForbidden(res, 'You can only delete your own offers');
      return;
    }

    await this.offerService.deleteById(offerId as string);
    this.sendNoContent(res);
  }

  public async getPremiumOffers(req: Request, res: Response): Promise<void> {
    const city = (req.params.city ?? req.query.city) as string;
    const premiumOffers = await this.offerService.findPremiumByCity(city);
    this.sendOk(res, premiumOffers.map((offer) => this.toResponse(offer)));
  }

  public async getFavoriteOffers(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const favoriteOffers = await this.offerService.findFavorites(userId);
    this.sendOk(res, favoriteOffers.map((offer) => this.toResponse(offer)));
  }

  public async toggleFavorite(req: Request, res: Response): Promise<void> {
    const { offerId, status } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const updatedOffer = status === '1'
      ? await this.offerService.addToFavorites(offerId as string, userId)
      : await this.offerService.removeFromFavorites(offerId as string, userId);

    if (!updatedOffer) {
      this.sendNotFound(res, 'Offer not updated');
      return;
    }

    this.sendOk(res, this.toResponse(updatedOffer));
  }

  public async removeFromFavorite(req: Request, res: Response): Promise<void> {
    const { offerId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      this.sendUnauthorized(res, 'User not authenticated');
      return;
    }

    await this.offerService.removeFromFavorites(offerId as string, userId);
    this.sendOk(res, { message: 'Offer removed from favorites' });
  }

  private toResponse(offer: any) {
    const author = offer.host ?? offer.authorId ?? {};
    const cityName = typeof offer.city === 'string' ? offer.city : offer.city?.name;
    const cityLocation = CITY_LOCATION[cityName] ?? { latitude: 0, longitude: 0 };

    return {
      id: offer.id ?? offer._id?.toString(),
      title: offer.title,
      description: offer.description,
      price: offer.price,
      rating: offer.rating,
      isPremium: offer.isPremium,
      isFavorite: offer.isFavorite,
      city: {
        name: cityName,
        location: cityLocation,
      },
      location: offer.location,
      previewImage: offer.previewImage,
      type: offer.type,
      bedrooms: offer.rooms ?? offer.bedrooms,
      maxAdults: offer.guests ?? offer.maxAdults,
      goods: offer.goods,
      host: {
        name: author?.name,
        email: author?.email,
        avatarUrl: author?.avatar ?? author?.avatarUrl,
        isPro: author?.isPro,
      },
      images: offer.images,
    };
  }
}
