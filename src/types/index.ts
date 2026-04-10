export type AppRole = 'dietitian' | 'client';

export type MealType = 'breakfast' | 'snack_1' | 'lunch' | 'snack_2' | 'dinner' | 'other';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  soma_id: string | null;
  sex: string | null;
  notes: string | null;
  must_change_password: boolean;
  dietitian_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_by: string;
}

export interface ClientTag {
  client_id: string;
  tag_id: string;
}

export interface WeeklyGoalItem {
  text: string;
  checked_days: boolean[];
}

export interface WeeklyGoals {
  id: string;
  client_id: string;
  start_date: string;
  end_date: string | null;
  goals: WeeklyGoalItem[];
  created_at: string;
}

export interface Meal {
  id: string;
  client_id: string;
  photo_url: string | null;
  meal_type: MealType;
  meal_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface MealComment {
  id: string;
  meal_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Reflection {
  id: string;
  client_id: string;
  meal_id: string | null;
  hunger_rating: number;
  cravings_rating: number;
  satisfaction_rating: number;
  notes: string | null;
  created_at: string;
}

export interface ReflectionReply {
  id: string;
  reflection_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'snack_1', label: 'Snack 1' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack_2', label: 'Snack 2' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'other', label: 'Other' },
];

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
