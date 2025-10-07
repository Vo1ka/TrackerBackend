import { IsInt, Min, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddStepDto {
  @IsInt()
  @Min(1)
  value: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
