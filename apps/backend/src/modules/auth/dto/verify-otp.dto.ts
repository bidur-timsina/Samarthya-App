import { IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString() userId: string;
  @IsString() code: string;
}
