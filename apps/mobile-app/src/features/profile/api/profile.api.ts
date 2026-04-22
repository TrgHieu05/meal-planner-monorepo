import axios from 'axios';
import { z } from 'zod';

import { normalizeOptionalString, resolveApiBaseUrl } from '@/services/api/api-config';

import type { ProfileScreenData } from '../types';

const API_TIMEOUT_MS = 10000;

const OptionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

const OptionListSchema = z.array(OptionSchema);

const ProfileOverviewResponseSchema = z.object({
  basic: z.object({
    email: z.string(),
    userName: z.string(),
    gender: z.string(),
    dateOfBirth: z.union([z.string(), z.date()]).nullable(),
  }),
  preferences: z
    .object({
      dietTypeId: z.number().int().positive(),
      goalId: z.number().int().positive(),
      cuisineTypeId: z.number().int().positive(),
      targetCalories: z.number().positive().nullable().optional(),
      activityLevel: z.enum(['HIGH', 'AVERAGE', 'LOW']).nullable().optional(),
    })
    .nullable(),
  latestMetric: z
    .object({
      id: z.number().int().positive(),
      heightCm: z.number().positive(),
      weightKg: z.number().positive(),
      bmi: z.number().positive(),
      recordedAt: z.union([z.string(), z.date()]),
    })
    .nullable(),
  allergies: z.object({
    list: z.array(
      z.object({
        id: z.number().int().positive(),
        name: z.string(),
      }),
    ),
  }),
  favoriteIngredients: z.object({
    list: z.array(
      z.object({
        id: z.number().int().positive(),
        name: z.string(),
      }),
    ),
  }),
});

type OptionItem = z.infer<typeof OptionSchema>;
type ProfileOverviewResponse = z.infer<typeof ProfileOverviewResponseSchema>;

export type ProfileApiConfig = {
  apiBaseUrl?: string;
  accessToken?: string;
};

const GENDER_LABEL_BY_CODE: Record<string, string> = {
  M: 'Male',
  F: 'Female',
  U: 'Unknown',
};

const ACTIVITY_LEVEL_LABEL_BY_CODE: Record<string, string> = {
  HIGH: 'High',
  AVERAGE: 'Average',
  LOW: 'Low',
};

const ENV_PROFILE_ACCESS_TOKEN = normalizeOptionalString(
  process.env.EXPO_PUBLIC_PROFILE_ACCESS_TOKEN,
);
const ENV_ACCESS_TOKEN = normalizeOptionalString(process.env.EXPO_PUBLIC_ACCESS_TOKEN);

const toDateOrNull = (value: string | Date | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveOptionName = (
  options: OptionItem[],
  id: number | null | undefined,
  fallbackLabel: string,
) => {
  if (id == null) {
    return null;
  }

  const found = options.find((item) => item.id === id);
  if (found?.name?.trim()) {
    return found.name;
  }

  return `${fallbackLabel} #${id}`;
};

const parseOptionList = (payload: unknown) => {
  const parsed = OptionListSchema.safeParse(payload);
  return parsed.success ? parsed.data : [];
};

const getOptionsFromSettledRequest = (result: PromiseSettledResult<unknown>) => {
  if (result.status !== 'fulfilled') {
    return [];
  }

  return parseOptionList(result.value);
};

const mapProfileOverviewToScreenData = (
  overview: ProfileOverviewResponse,
  dietTypes: OptionItem[],
  goals: OptionItem[],
  cuisineTypes: OptionItem[],
): ProfileScreenData => {
  const normalizedGender = overview.basic.gender.trim().toUpperCase();
  const preferences = overview.preferences;
  const latestMetric = overview.latestMetric;

  const dietType = resolveOptionName(dietTypes, preferences?.dietTypeId, 'Diet Type');
  const goal = resolveOptionName(goals, preferences?.goalId, 'Goal');
  const cuisineType = resolveOptionName(
    cuisineTypes,
    preferences?.cuisineTypeId,
    'Cuisine Type',
  );

  return {
    basicInfo: {
      userName: overview.basic.userName,
      email: overview.basic.email,
      gender: GENDER_LABEL_BY_CODE[normalizedGender] ?? overview.basic.gender,
      dob: toDateOrNull(overview.basic.dateOfBirth),
    },
    preferences: {
      dietType,
      goal,
      cuisineTypes: cuisineType ? [cuisineType] : [],
      targetCalories: preferences?.targetCalories ?? null,
      activityLevel:
        preferences?.activityLevel == null
          ? null
          : ACTIVITY_LEVEL_LABEL_BY_CODE[preferences.activityLevel] ??
            preferences.activityLevel,
      notificationsEnabled: null,
    },
    metrics: {
      weight: latestMetric?.weightKg ?? null,
      height: latestMetric?.heightCm ?? null,
      bmi: latestMetric?.bmi ?? null,
      bodyFatPercent: null,
      updatedAt: toDateOrNull(latestMetric?.recordedAt),
    },
  };
};

export async function fetchProfileScreenData(
  config: ProfileApiConfig = {},
): Promise<ProfileScreenData> {
  const apiBaseUrl = resolveApiBaseUrl(config.apiBaseUrl);
  const accessToken =
    normalizeOptionalString(config.accessToken) ?? ENV_PROFILE_ACCESS_TOKEN ?? ENV_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'Missing access token. Set EXPO_PUBLIC_PROFILE_ACCESS_TOKEN (or EXPO_PUBLIC_ACCESS_TOKEN) in .env.',
    );
  }

  try {
    const [profileResponse, optionResults] = await Promise.all([
      axios.get(`${apiBaseUrl}/v1/profile/overview`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: API_TIMEOUT_MS,
      }),
      Promise.allSettled([
        axios
          .get(`${apiBaseUrl}/v1/options/diet-types`, { timeout: API_TIMEOUT_MS })
          .then((response) => response.data),
        axios
          .get(`${apiBaseUrl}/v1/options/goals`, { timeout: API_TIMEOUT_MS })
          .then((response) => response.data),
        axios
          .get(`${apiBaseUrl}/v1/options/cuisine-types`, { timeout: API_TIMEOUT_MS })
          .then((response) => response.data),
      ]),
    ]);

    const profileParsed = ProfileOverviewResponseSchema.safeParse(profileResponse.data);
    if (!profileParsed.success) {
      throw new Error('Profile response payload is invalid.');
    }

    const [dietTypesResult, goalsResult, cuisineTypesResult] = optionResults;

    const dietTypes = getOptionsFromSettledRequest(dietTypesResult);
    const goals = getOptionsFromSettledRequest(goalsResult);
    const cuisineTypes = getOptionsFromSettledRequest(cuisineTypesResult);

    return mapProfileOverviewToScreenData(
      profileParsed.data,
      dietTypes,
      goals,
      cuisineTypes,
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error(
        'Unauthorized request. Please use a valid JWT in EXPO_PUBLIC_PROFILE_ACCESS_TOKEN.',
      );
    }

    throw error;
  }
}
