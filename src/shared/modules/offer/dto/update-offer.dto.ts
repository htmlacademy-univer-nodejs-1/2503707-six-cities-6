import {
  IsString, Length, IsDateString, IsEnum, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max, IsNumber, ValidateNested, IsOptional, IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OfferType } from '../../../types/index.js';

export class LocationDto {
  @IsNumber()
    latitude!: number;

  @IsNumber()
    longitude!: number;
}

export class UpdateOfferDto {
  @IsOptional() @IsString() @Length(10, 100)
    title?: string;

  @IsOptional() @IsString() @Length(20, 1024)
    description?: string;

  @IsOptional() @IsDateString()
    postDate?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'object' && value !== null ? value.name : value)
    city?: string;

  @IsOptional() @IsString()
    previewImage?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true })
    images?: string[];

  @IsOptional() @IsBoolean()
    isPremium?: boolean;

  @IsOptional() @IsBoolean()
    isFavorite?: boolean;

  @IsOptional() @IsNumber() @Min(1) @Max(5)
    rating?: number;

  @IsOptional() @IsEnum(OfferType)
    type?: OfferType;

  @IsOptional() @IsInt() @Min(1) @Max(8)
  @Transform(({ value, obj }) => value ?? obj.bedrooms)
    rooms?: number;

  @IsOptional() @IsInt() @Min(1) @Max(10)
  @Transform(({ value, obj }) => value ?? obj.maxAdults)
    guests?: number;

  @IsOptional() @IsInt() @Min(100) @Max(100000)
    price?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
    goods?: string[];

  @IsOptional() @IsMongoId()
    authorId?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
    categories?: string[];

  @IsOptional() @ValidateNested() @Type(() => LocationDto)
    location?: LocationDto;
}
