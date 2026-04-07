export type AppRole = 'dietitian' | 'client';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  start_date: string | null;
  notes: string | null;
  must_change_password: boolean;
  dietitian_id: string | null;
  created_at: string;
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
  week_start: string;
  goals: WeeklyGoalItem[];
  created_at: string;
}

export interface Meal {
  id: string;
  client_id: string;
  photo_url: string | null;
  meal_type: MealType;
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
