import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsIn } from 'class-validator';

export class CreateTeamGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  targetValue: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @IsOptional()
  ownerId?: number;

  @IsString()
  @IsOptional()
  @IsIn(['workspace', 'team', 'private'])
  visibility?: string;
}
