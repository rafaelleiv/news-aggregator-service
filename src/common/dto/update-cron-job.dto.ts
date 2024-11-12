import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCronJobDto {
  @IsOptional()
  @IsString()
  interval?: string;

  @IsOptional()
  @IsDate()
  lastPublishedAt?: Date;

  @IsOptional()
  @IsInt()
  pageSize?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
