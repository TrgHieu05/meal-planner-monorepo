import type { LucideIcon } from 'lucide-react-native';

export interface UserDetailItem {
  id: string;
  label: string;
  value: string;
  iconName: LucideIcon;
}

export type ProfileBasicInfo = {
  userName: string;
  email: string;
  gender: string | null;
  dob: Date | null;
};

export type ProfilePreferences = {
  dietType: string | null;
  goal: string | null;
  cuisineType: string | null;
  targetCalories: number | null;
  activityLevel: string | null;
};

export type ProfileMetrics = {
  weight: number | null;
  height: number | null;
  bmi: number | null;
  updatedAt: Date | null;
};

export type ProfileIngredientTag = {
  id: number;
  name: string;
};

export type ProfileScreenData = {
  basicInfo: ProfileBasicInfo;
  preferences: ProfilePreferences;
  metrics: ProfileMetrics;
  allergies: ProfileIngredientTag[];
  favoriteIngredients: ProfileIngredientTag[];
  isProfileIncomplete: boolean;
};