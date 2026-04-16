export class RandomGenerator {
  public static getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static getRandomElement<T>(arr: T[]): T {
    return arr[this.getRandomNumber(0, arr.length - 1)];
  }

  public static getRandomElements<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  }

  public static getRandomDecimal(min: number, max: number, decimals = 1): number {
    const num = Math.random() * (max - min) + min;
    return parseFloat(num.toFixed(decimals));
  }

  public static getRandomDate(): string {
    const today = new Date();
    const daysAgo = this.getRandomNumber(0, 30);
    today.setDate(today.getDate() - daysAgo);
    return today.toISOString();
  }
}
