import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  settings?: Record<string, any>;
}
