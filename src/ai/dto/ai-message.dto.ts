export class AiMessageDto {
  id: number;
  type: 'celebration' | 'insight' | 'motivation' | 'recommendation' | 'challenge';
  priority: number;
  message: string;
  emoji: string;
  metadata: Record<string, any>;
  shown: boolean;
  dismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
  action?: {
    label: string;
    type: 'navigate' | 'create_goal' | 'dismiss';
    payload?: any;
  };
}

export class InsightsResponseDto {
  messages: AiMessageDto[];
  stats: {
    streak: number;
    totalProgress: number;
    activeGoals: number;
  };
}

export class UserAnalyticsDto {
  user: {
    id: number;
    daysActive: number;
    lastActiveDate: Date | null;
  };
  goals: {
    total: number;
    active: number;
    completed: number;
    abandoned: number;
    byCategory: Record<string, number>;
  };
  activity: {
    streak: number;
    longestStreak: number;
    avgStepsPerDay: number;
    totalSteps: number;
    lastStepDate: Date | null;
    daysSinceLastStep: number;
  };
  patterns: {
    mostActiveDay: string | null;
    mostActiveHour: number | null;
    avgGoalDuration: number;
    completionRate: number;
  };
  recentGoals: GoalProgressDto[];
}

export class GoalProgressDto {
  goalId: number;
  title: string;
  category?: string;
  progress: number;
  currentValue: number;
  targetValue: number;
  velocity: number;
  daysActive: number;
  daysSinceLastStep: number;
  daysToComplete: number | null;
  isStagnant: boolean;
  isRushing: boolean;
  estimatedDays?: number;
  completedAt?: Date;
}
