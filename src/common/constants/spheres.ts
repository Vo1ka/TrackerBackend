export const SPHERES = [
  'work',
  'education',
  'health',
  'finance',
  'relationships',
  'hobby',
  'personal_growth',
] as const;

export type Sphere = typeof SPHERES[number];

// Лейблы для UI (можно использовать на фронте)
export const SPHERE_LABELS: Record<Sphere, string> = {
  work: 'Работа',
  education: 'Образование',
  health: 'Здоровье',
  finance: 'Финансы',
  relationships: 'Отношения',
  hobby: 'Хобби',
  personal_growth: 'Личностный рост',
};
