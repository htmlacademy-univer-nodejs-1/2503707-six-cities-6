import { IsString, Min, Max, IsInt, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  public comment!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  public rating!: number;

  @IsOptional()
  @IsString()
  public offerId?: string;

  @IsOptional()
  @IsString()
  public userId?: string;
}
