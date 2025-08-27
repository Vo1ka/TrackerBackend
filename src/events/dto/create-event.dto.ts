import { IsIn, IsInt, IsISO8601, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsIn([
    'create_goal', 'update_goal', 'delete_goal',
    'create_step', 'delete_step',
    'open_dashboard', 'view_insight'
  ])
  eventType: string;

  @IsOptional() @IsISO8601()
  occurredAt?: string;

  @IsOptional() @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional() @IsString() @MaxLength(64)
  clientEventId?: string;

  @IsOptional() @IsInt()
  sphereId?: number;

  @IsOptional() @IsInt()
  goalId?: number;

  @IsOptional() @IsInt()
  stepId?: number;

  @IsOptional() @IsIn(['web','mobile','service'])
  source?: string;
}
