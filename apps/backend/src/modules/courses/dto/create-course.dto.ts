import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { CourseLevel } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() whatYouWillLearn?: string;
  @IsOptional() @IsString() requirements?: string;
  @IsOptional() @IsString() syllabus?: string;
  @IsOptional() @IsString() thumbnail?: string;
  @IsOptional() @Transform(({ value }) => parseFloat(value)) @IsNumber() price?: number;
  @IsOptional() @IsEnum(CourseLevel) level?: CourseLevel;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}
