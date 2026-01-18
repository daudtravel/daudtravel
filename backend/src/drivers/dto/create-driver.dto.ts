import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
