import { Offer, OfferType } from '../types/index.js';

export function createOffer(offerData: string): Offer {
  const [
    title,
    description,
    createdDate,
    image,
    isPro,
    price,
    categories,
    name,
    email,
    avatarPath,
    type
  ] = offerData.replace('\n', '').split('\t');

  const user = {
    email,
    name,
    avatarPath,
    isPro: isPro === 'true',
  };

  return {
    title,
    description,
    image,
    user,
    postDate: new Date(createdDate),
    type: type as OfferType,
    price: Number.parseInt(price, 10),
    categories: categories.split(';')
      .map((categoryName) => ({name: categoryName})),
  };
}
