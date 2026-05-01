import { z } from 'zod';

import {
  AllergyResponseSchema,
  AllergyUpdateSchema,
  type AllergyResponse,
  type AllergyUpdate,
} from '@meal/shared/types/allergy';
import {
  CuisineTypeListSchema,
  type CuisineType,
} from '@meal/shared/types/cuisine-type';
import {
  DietTypeListSchema,
  type DietType,
} from '@meal/shared/types/diet-type';
import {
  FavoriteIngredientResponseSchema,
  FavoriteIngredientUpdateSchema,
  type FavoriteIngredientResponse,
  type FavoriteIngredientUpdate,
} from '@meal/shared/types/favorite-ingredient';
import { GoalListSchema, type Goal } from '@meal/shared/types/goal';
import {
  IngredientCatalogQuerySchema,
  IngredientCatalogResponseSchema,
  IngredientListConflictResponseSchema,
  type IngredientCatalogQuery,
  type IngredientCatalogResponse,
  type IngredientListConflictResponse,
} from '@meal/shared/types/ingredient';
import {
  MetricCreateResponseSchema,
  MetricCreateSchema,
  MetricResponseSchema,
  type MetricCreate,
  type MetricCreateResponse,
  type MetricResponse,
} from '@meal/shared/types/metric';
import {
  ProfileCreateSchema,
  ProfileOverviewResponseSchema,
  ProfileResponseSchema,
  ProfileUpdateSchema,
  type ProfileCreate,
  type ProfileOverview,
  type ProfileResponse,
  type ProfileUpdate,
} from '@meal/shared/types/profile';
import {
  UserResponseSchema,
  UserUpdateSchema,
  type UserResponse,
  type UserUpdate,
} from '@meal/shared/types/user';

import {
  ApiError,
  createApiClient,
  createAuthenticatedApiClient,
} from '@/services/api/http-client';

import type { ProfileScreenData } from '../types';

type OptionItem = DietType | Goal | CuisineType;

const ApiDateSchema = z.coerce.date();
const NullableApiDateSchema = z.preprocess(
  (value) => (value == null ? null : value),
  z.coerce.date().nullable(),
);

const UserResponseApiSchema = UserResponseSchema.extend({
  dateOfBirth: NullableApiDateSchema,
});

const MetricResponseApiSchema = MetricResponseSchema.extend({
  recordedAt: ApiDateSchema,
});

const MetricCreateResponseApiSchema = MetricCreateResponseSchema.extend({
  recordedAt: ApiDateSchema,
});

const ProfileOverviewApiSchema = ProfileOverviewResponseSchema.extend({
  basic: UserResponseApiSchema,
  latestMetric: MetricResponseApiSchema.nullable(),
});

export type PublicProfileApiConfig = {
  apiBaseUrl?: string;
};

export type ProfileApiConfig = PublicProfileApiConfig & {
  accessToken?: string;
};

export type AuthenticatedProfileApiConfig = PublicProfileApiConfig & {
  accessToken: string;
};

export type ProfileOptions = {
  dietTypes: DietType[];
  goals: Goal[];
  cuisineTypes: CuisineType[];
};

const GENDER_LABEL_BY_CODE: Record<string, string> = {
  M: 'Male',
  F: 'Female',
};

const ACTIVITY_LEVEL_LABEL_BY_CODE: Record<string, string> = {
  HIGH: 'High',
  AVERAGE: 'Average',
  LOW: 'Low',
};

const parseProfileOverview = (payload: unknown): ProfileOverview => {
  return parseWithSchema(
    ProfileOverviewApiSchema,
    payload,
    'Profile overview response payload is invalid.',
  );
};

const parseUserResponse = (payload: unknown): UserResponse => {
  return parseWithSchema(
    UserResponseApiSchema,
    payload,
    'User response payload is invalid.',
  );
};

const parseProfileResponse = (payload: unknown): ProfileResponse => {
  return parseWithSchema(
    ProfileResponseSchema,
    payload,
    'Profile response payload is invalid.',
  );
};

const parseMetricResponse = (payload: unknown): MetricResponse => {
  return parseWithSchema(
    MetricResponseApiSchema,
    payload,
    'Metric response payload is invalid.',
  );
};

const parseMetricCreateResponse = (payload: unknown): MetricCreateResponse => {
  return parseWithSchema(
    MetricCreateResponseApiSchema,
    payload,
    'Metric creation response payload is invalid.',
  );
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

const mapProfileOverviewToScreenData = (
  overview: ProfileOverview,
  dietTypes: OptionItem[],
  goals: OptionItem[],
  cuisineTypes: OptionItem[],
): ProfileScreenData => {
  const normalizedGender = overview.basic.gender?.trim().toUpperCase() ?? null;
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
      gender:
        normalizedGender == null
          ? null
          : GENDER_LABEL_BY_CODE[normalizedGender] ?? overview.basic.gender,
      dob: overview.basic.dateOfBirth,
    },
    preferences: {
      dietType,
      goal,
      cuisineType,
      targetCalories: preferences?.targetCalories ?? null,
      activityLevel:
        preferences?.activityLevel == null
          ? null
          : ACTIVITY_LEVEL_LABEL_BY_CODE[preferences.activityLevel] ??
            preferences.activityLevel,
    },
    metrics: {
      weight: latestMetric?.weightKg ?? null,
      height: latestMetric?.heightCm ?? null,
      bmi: latestMetric?.bmi ?? null,
      updatedAt: latestMetric?.recordedAt ?? null,
    },
  };
};

export async function fetchProfileOverview(
  config: AuthenticatedProfileApiConfig,
): Promise<ProfileOverview> {
  const client = createProtectedProfileApiClient(config);
  const response = await client.get('/v1/profile/overview');

  return parseProfileOverview(response.data);
}

export async function fetchDietTypes(
  config: PublicProfileApiConfig = {},
): Promise<DietType[]> {
  const client = createApiClient(config);
  const response = await client.get('/v1/options/diet-types');

  return parseWithSchema(
    DietTypeListSchema,
    response.data,
    'Diet types response payload is invalid.',
  );
}

export async function fetchGoals(
  config: PublicProfileApiConfig = {},
): Promise<Goal[]> {
  const client = createApiClient(config);
  const response = await client.get('/v1/options/goals');

  return parseWithSchema(
    GoalListSchema,
    response.data,
    'Goals response payload is invalid.',
  );
}

export async function fetchCuisineTypes(
  config: PublicProfileApiConfig = {},
): Promise<CuisineType[]> {
  const client = createApiClient(config);
  const response = await client.get('/v1/options/cuisine-types');

  return parseWithSchema(
    CuisineTypeListSchema,
    response.data,
    'Cuisine types response payload is invalid.',
  );
}

export async function fetchProfileOptions(
  config: PublicProfileApiConfig = {},
): Promise<ProfileOptions> {
  const [dietTypes, goals, cuisineTypes] = await Promise.all([
    fetchDietTypes(config),
    fetchGoals(config),
    fetchCuisineTypes(config),
  ]);

  return {
    dietTypes,
    goals,
    cuisineTypes,
  };
}

export async function updateCurrentUser(config: {
  accessToken: string;
  apiBaseUrl?: string;
  payload: UserUpdate;
}): Promise<UserResponse> {
  const client = createProtectedProfileApiClient(config);
  const payload = serializeUserUpdatePayload(config.payload);
  const response = await client.patch('/v1/users', payload);

  return parseUserResponse(response.data);
}

export async function createProfilePreferences(config: {
  accessToken: string;
  apiBaseUrl?: string;
  payload: ProfileCreate;
}): Promise<ProfileResponse> {
  const client = createProtectedProfileApiClient(config);
  const payload = parseWithSchema(
    ProfileCreateSchema,
    config.payload,
    'Profile creation payload is invalid.',
  );
  const response = await client.post('/v1/profile', payload);

  return parseProfileResponse(response.data);
}

export async function updateProfilePreferences(config: {
  accessToken: string;
  apiBaseUrl?: string;
  payload: ProfileUpdate;
}): Promise<ProfileResponse> {
  const client = createProtectedProfileApiClient(config);
  const payload = parseWithSchema(
    ProfileUpdateSchema,
    config.payload,
    'Profile update payload is invalid.',
  );
  const response = await client.patch('/v1/profile', payload);

  return parseProfileResponse(response.data);
}

export async function createMetricEntry(config: {
  accessToken: string;
  apiBaseUrl?: string;
  payload: MetricCreate;
}): Promise<MetricCreateResponse> {
  const client = createProtectedProfileApiClient(config);
  const payload = parseWithSchema(
    MetricCreateSchema,
    config.payload,
    'Metric payload is invalid.',
  );
  const response = await client.post('/v1/metrics', payload);

  return parseMetricCreateResponse(response.data);
}

export async function fetchAllergies(
  config: AuthenticatedProfileApiConfig,
): Promise<AllergyResponse> {
  const client = createProtectedProfileApiClient(config);
  const response = await client.get('/v1/allergies');

  return parseWithSchema(
    AllergyResponseSchema,
    response.data,
    'Allergy response payload is invalid.',
  );
}

export async function updateAllergies(config: {
  accessToken: string;
  apiBaseUrl?: string;
  payload: AllergyUpdate;
}): Promise<AllergyResponse> {
  const client = createProtectedProfileApiClient(config);
  const payload = parseWithSchema(
    AllergyUpdateSchema,
    config.payload,
    'Allergy update payload is invalid.',
  );
  const response = await client.patch('/v1/allergies', payload);

  return parseWithSchema(
    AllergyResponseSchema,
    response.data,
    'Allergy response payload is invalid.',
  );
}

export async function fetchFavoriteIngredients(
  config: AuthenticatedProfileApiConfig,
): Promise<FavoriteIngredientResponse> {
  const client = createProtectedProfileApiClient(config);
  const response = await client.get('/v1/favorite-ingredients');

  return parseWithSchema(
    FavoriteIngredientResponseSchema,
    response.data,
    'Favorite ingredient response payload is invalid.',
  );
}

export async function updateFavoriteIngredients(config: {
  accessToken: string;
  apiBaseUrl?: string;
  payload: FavoriteIngredientUpdate;
}): Promise<FavoriteIngredientResponse> {
  const client = createProtectedProfileApiClient(config);
  const payload = parseWithSchema(
    FavoriteIngredientUpdateSchema,
    config.payload,
    'Favorite ingredient update payload is invalid.',
  );
  const response = await client.patch('/v1/favorite-ingredients', payload);

  return parseWithSchema(
    FavoriteIngredientResponseSchema,
    response.data,
    'Favorite ingredient response payload is invalid.',
  );
}

export async function fetchIngredientCatalog(config: {
  apiBaseUrl?: string;
  query?: Partial<IngredientCatalogQuery>;
} = {}): Promise<IngredientCatalogResponse> {
  const client = createApiClient(config);
  const query = parseWithSchema(
    IngredientCatalogQuerySchema,
    config.query ?? {},
    'Ingredient catalog query is invalid.',
  );
  const response = await client.get('/v1/ingredients', {
    params: query,
  });

  return parseWithSchema(
    IngredientCatalogResponseSchema,
    response.data,
    'Ingredient catalog response payload is invalid.',
  );
}

export function getIngredientConflictResponse(
  error: unknown,
): IngredientListConflictResponse | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const parsed = IngredientListConflictResponseSchema.safeParse(error.data);
  return parsed.success ? parsed.data : null;
}

export async function fetchProfileScreenData(
  config: AuthenticatedProfileApiConfig,
): Promise<ProfileScreenData> {
  const [profileOverview, profileOptions] = await Promise.all([
    fetchProfileOverview(config),
    fetchProfileOptions(config),
  ]);

  return mapProfileOverviewToScreenData(
    profileOverview,
    profileOptions.dietTypes,
    profileOptions.goals,
    profileOptions.cuisineTypes,
  );
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  errorMessage: string,
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(errorMessage);
  }

  return parsed.data;
}

function createProtectedProfileApiClient(config: AuthenticatedProfileApiConfig) {
  return createAuthenticatedApiClient({
    apiBaseUrl: config.apiBaseUrl,
    accessToken: config.accessToken,
  });
}

function serializeUserUpdatePayload(payload: UserUpdate) {
  const parsedPayload = parseWithSchema(
    UserUpdateSchema,
    payload,
    'User update payload is invalid.',
  );
  const serializedPayload: Record<string, unknown> = {};

  if (parsedPayload.userName !== undefined) {
    serializedPayload.userName = parsedPayload.userName;
  }

  if (parsedPayload.gender !== undefined) {
    serializedPayload.gender = parsedPayload.gender;
  }

  if (parsedPayload.dateOfBirth !== undefined) {
    const dateOfBirth = parsedPayload.dateOfBirth;
    serializedPayload.dateOfBirth =
      dateOfBirth === null ? null : formatDateOnly(dateOfBirth);
  }

  return serializedPayload;
}

function formatDateOnly(date: Date) {
  if (Number.isNaN(date.getTime())) {
    throw new Error('dateOfBirth must be a valid Date instance.');
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
