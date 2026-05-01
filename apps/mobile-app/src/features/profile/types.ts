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
  gender: string;
  dob: Date | null;
};

export type ProfilePreferences = {
  dietType: string | null;
  goal: string | null;
  cuisineTypes: string[];
  targetCalories: number | null;
  activityLevel: string | null;
  notificationsEnabled: boolean | null;
};

export type ProfileMetrics = {
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bodyFatPercent: number | null;
  updatedAt: Date | null;
};

export type ProfileScreenData = {
  basicInfo: ProfileBasicInfo;
  preferences: ProfilePreferences;
  metrics: ProfileMetrics;
};