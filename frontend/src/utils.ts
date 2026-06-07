import { MAX_PERCENT_STARS_WIDTH, STARS_COUNT } from './const';

export const formatDate = (date: string) => new Intl.DateTimeFormat(
  'en-US',
  {'month':'long','year':'numeric'}
).format( new Date(date) );

export const getStarsWidth = (rating: number) =>
  `${(MAX_PERCENT_STARS_WIDTH * Math.round(rating)) / STARS_COUNT}%`;

export const getRandomElement = <T>(array: readonly T[]): T => array[Math.floor(Math.random() * array.length)];
export const pluralize = (str: string, count: number) => count === 1 ? str : `${str}s`;
export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export class Token {
  private static _name = 'six-cities-auth-token';

  static get() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${this._name}=`);
    if (parts.length === 2) {return parts.pop()?.split(';').shift() ?? '';}
    return '';
  }

  static save(token: string) {
    const date = new Date();
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${this._name}=${token}; ${expires}; path=/`;
  }

  static drop() {
    document.cookie = `${this._name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
