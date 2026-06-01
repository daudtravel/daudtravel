import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;
}
