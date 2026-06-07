import {
  IsString, Length, IsDateString, IsEnum, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max, IsNumber, IsOptional, ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OfferType } from '../../../types/index.js';

export class LocationDto {
  @IsNumber()
    latitude!: number;

  @IsNumber()
    longitude!: number;
}

export class CreateOfferDto {
  @IsString()
  @Length(10, 100)
    title!: string;

  @IsString()
  @Length(20, 1024)
    description!: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || new Date().toISOString())
    postDate?: string;

  @IsString()
  @Transform(({ value }) => typeof value === 'object' && value !== null ? value.name : value)
    city!: string;

  @IsString()
    previewImage!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Transform(({ value }) => value || [])
    images?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
    isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
    isFavorite?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => value || 0)
    rating?: number;

  @IsEnum(OfferType)
  @Transform(({ value }) => {
    const typeMap: Record<string, OfferType> = {
      house: OfferType.Buy,
      apartment: OfferType.Buy,
      room: OfferType.Buy,
      hotel: OfferType.Buy,
    };
    return typeMap[value] || value;
  })
    type!: OfferType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  @Transform(({ value, obj }) => {
    const resolved = typeof value !== 'undefined' ? value : obj.bedrooms;
    return resolved !== undefined ? Number(resolved) : 1;
  }, { toClassOnly: true })
    rooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @Transform(({ value, obj }) => {
    const resolved = typeof value !== 'undefined' ? value : obj.maxAdults;
    return resolved !== undefined ? Number(resolved) : 1;
  }, { toClassOnly: true })
    guests?: number;

  @IsInt()
  @Min(100)
  @Max(100000)
    price!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value || [])
    goods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value || [])
    categories?: string[];

  @ValidateNested()
  @Type(() => LocationDto)
    location!: LocationDto;
}
