import { createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';
import { Offer } from '../types/offer.type.js';

export class TSVWriter {
  private static offerToRow(offer: Offer): string {
    return [
      offer.title,
      offer.description,
      offer.postDate,
      offer.city,
      offer.previewImage,
      offer.images.join(';'),
      offer.isPremium,
      offer.isFavorite,
      offer.rating,
      offer.type,
      offer.rooms,
      offer.guests,
      offer.price,
      offer.facilities.join(';'),
      offer.author,
    ].join('\t');
  }

  public static async writeToFile(filePath: string, offers: Offer[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream: Writable = createWriteStream(filePath, { encoding: 'utf-8' });

      const header =
        'title\tdescription\tpostDate\tcity\tpreviewImage\timages\tisPremium\tisFavorite\trating\ttype\trooms\tguests\tprice\tfacilities\tauthor\n';
      writeStream.write(header);

      for (const offer of offers) {
        const row = this.offerToRow(offer);
        writeStream.write(`${row}\n`);
      }

      writeStream.end();

      writeStream.on('error', (err) => {
        reject(new Error(`Failed to write TSV file: ${err.message}`));
      });

      writeStream.on('finish', () => {
        resolve();
      });
    });
  }
}
