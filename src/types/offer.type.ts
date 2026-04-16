import { City } from './city,type.js';

export type Offer = {
  title: string;
  description: string;
  postDate: string;
  city: City;
  previewImage: string;
  images: string[];
  isPremium: boolean;
  isFavorite: boolean;
  rating: number;
  type: 'apartment' | 'house' | 'room' | 'hotel';
  rooms: number;
  guests: number;
  price: number;
  facilities: string[];
  author: string;
};
