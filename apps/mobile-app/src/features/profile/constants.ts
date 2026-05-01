import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  Calendar,
  Flame,
  Mail,
  Mars,
  Ruler,
  Target,
  User,
  UtensilsCrossed,
  Venus,
  Weight,
} from 'lucide-react-native';

export interface ProfileUIConfigItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  resolveIcon?: (value: unknown) => LucideIcon;
  formatValue?: (value: unknown) => string;
}

const GENDER_ICON_BY_VALUE: Record<string, LucideIcon> = {
  male: Mars,
  female: Venus,
};

const normalizeGender = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const formatFieldLabel = (key: string) => {
  const spaced = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const formatProfileValue = (value: unknown): string => {
  if (value == null) {
    return '-';
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length ? normalized : '-';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '-';
    }

    return value.toLocaleDateString('vi-VN');
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => formatProfileValue(item)).filter((item) => item !== '-');
    return items.length ? items.join(', ') : '-';
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    if (!entries.length) {
      return '-';
    }

    return entries
      .map(([key, nestedValue]) => `${formatFieldLabel(key)}: ${formatProfileValue(nestedValue)}`)
      .join(', ');
  }

  return String(value);
};

export const BASIC_INFO_UI_CONFIG: ProfileUIConfigItem[] = [
  {
    key: 'userName',
    label: 'User Name',
    icon: User,
  },
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
  },
  {
    key: 'gender',
    label: 'Gender',
    resolveIcon: (value: unknown) =>
      GENDER_ICON_BY_VALUE[normalizeGender(value) ?? ''] ?? User,
  },
  {
    key: 'dob',
    label: 'Date of Birth',
    icon: Calendar,
  },
];

export const PREFERENCES_UI_CONFIG: ProfileUIConfigItem[] = [
  {
    key: 'dietType',
    label: 'Diet Type',
    icon: UtensilsCrossed,
  },
  {
    key: 'goal',
    label: 'Goal',
    icon: Target,
  },
  {
    key: 'cuisineType',
    label: 'Cuisine Type',
    icon: User,
  },
  {
    key: 'targetCalories',
    label: 'Target Calories',
    icon: Flame,
    formatValue: (value: unknown) => {
      const calories = toNumber(value);
      return calories == null ? formatProfileValue(value) : `${calories.toLocaleString()} kcal/day`;
    },
  },
  {
    key: 'activityLevel',
    label: 'Activity Level',
    icon: Activity,
  },
];

export const METRICS_UI_CONFIG: ProfileUIConfigItem[] = [
  {
    key: 'weight',
    label: 'Weight',
    icon: Weight,
    formatValue: (value: unknown) => {
      const weight = toNumber(value);
      return weight == null ? formatProfileValue(value) : `${weight} kg`;
    },
  },
  {
    key: 'height',
    label: 'Height',
    icon: Ruler,
    formatValue: (value: unknown) => {
      const height = toNumber(value);
      return height == null ? formatProfileValue(value) : `${height} cm`;
    },
  },
  {
    key: 'bmi',
    label: 'BMI',
    icon: Activity,
    formatValue: (value: unknown) => {
      const bmi = toNumber(value);
      return bmi == null ? formatProfileValue(value) : bmi.toFixed(1);
    },
  },
  {
    key: 'updatedAt',
    label: 'Last Updated',
    icon: Calendar,
  },
];

export const getProfileItemIcon = (
  config: ProfileUIConfigItem,
  value: unknown,
): LucideIcon => config.resolveIcon?.(value) ?? config.icon ?? User;
