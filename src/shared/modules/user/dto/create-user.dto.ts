import { IsString, Length, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 15)
    name!: string;

  @IsString()
  @Length(5, 40)
    email!: string;

  @IsOptional()
  @IsString()
    avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
    isPro?: boolean;

  @IsString()
  @Length(6, 12)
    password!: string;
}
