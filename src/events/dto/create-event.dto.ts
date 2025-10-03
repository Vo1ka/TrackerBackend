import { 
  IsIn, IsInt, IsISO8601, IsObject, IsOptional, 
  IsString, MaxLength 
} from 'class-validator';

// Список сфер
const SPHERES = [
  'work', 'education', 'health', 'finance', 
  'relationships', 'hobby', 'personal_growth'
] as const;

const EVENT_TYPES = [
  'create_goal', 'update_goal', 'delete_goal', 'complete_goal',
  'create_step', 'complete_step', 'delete_step',
  'create_subtask', 'complete_subtask', 'delete_subtask',
  'open_dashboard', 'view_insight', 'view_calendar', 'view_recommendations',
  'unlock_achievement', 'view_achievement',
  'reminder_created', 'reminder_fired', 'reminder_completed', 
  'reminder_snoozed', 'reminder_dismissed',
  'recommendation_shown', 'recommendation_clicked', 'recommendation_dismissed',
] as const;

export class CreateEventDto {
  @IsIn(EVENT_TYPES)
  eventType: typeof EVENT_TYPES[number];

  @IsOptional() 
  @IsISO8601()
  occurredAt?: string;

  @IsOptional() 
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional() 
  @IsString() 
  @MaxLength(64)
  clientEventId?: string;

  @IsOptional() 
  @IsIn(SPHERES)
  sphere?: typeof SPHERES[number]; 

  @IsOptional() 
  @IsInt()
  goalId?: number;

  @IsOptional() 
  @IsInt()
  stepId?: number;

  @IsOptional() 
  @IsInt()
  subtaskId?: number;

  @IsOptional() 
  @IsIn(['web', 'mobile', 'service'])
  source?: string;
}
