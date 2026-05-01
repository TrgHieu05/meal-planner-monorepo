import axios from 'axios';

import {
  createMetricEntry,
  createProfilePreferences,
  fetchProfileScreenData,
  getIngredientConflictResponse,
  updateCurrentUser,
  updateProfilePreferences,
} from './profile.api';
import {
  extractFieldErrors,
  FormValidationError,
} from '../utils/profile-form';

import { ApiError } from '@/services/api/http-client';

jest.mock('@/config/runtime-config', () => ({
  normalizeOptionalString: (value?: string | null) => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  },
  resolveExpoExtraString: jest.fn(() => null),
}));

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(),
      isAxiosError: jest.fn((error) => Boolean(error?.isAxiosError)),
    },
  };
});

type MockClient = {
  get: jest.Mock;
  patch: jest.Mock;
  post: jest.Mock;
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  interceptors: {
    response: {
      use: jest.Mock;
    };
  };
};

describe('profile.api', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  function createClient(): MockClient {
    return {
      get: jest.fn(async (url: string) => {
        if (url === '/v1/profile/overview') {
          return {
            data: {
              basic: {
                email: 'jane@example.com',
                userName: 'Jane Doe',
                gender: 'M',
                dateOfBirth: '2000-01-02',
              },
              preferences: {
                dietTypeId: 1,
                goalId: 2,
                cuisineTypeId: 3,
                targetCalories: 1800,
                activityLevel: 'AVERAGE',
              },
              latestMetric: {
                id: 9,
                heightCm: 165,
                weightKg: 58,
                bmi: 21.3,
                recordedAt: '2026-05-01T00:00:00.000Z',
              },
              allergies: {
                list: [{ id: 10, name: 'Peanut' }],
              },
              favoriteIngredients: {
                list: [{ id: 11, name: 'Salmon' }],
              },
            },
          };
        }

        if (url === '/v1/options/diet-types') {
          return {
            data: [{ id: 1, name: 'Vegetarian', description: null }],
          };
        }

        if (url === '/v1/options/goals') {
          return {
            data: [{ id: 2, name: 'Maintain Weight', description: null }],
          };
        }

        if (url === '/v1/options/cuisine-types') {
          return {
            data: [{ id: 3, name: 'Vietnamese', description: null }],
          };
        }

        throw new Error(`Unhandled GET ${url}`);
      }),
      patch: jest.fn(async (url: string, payload: unknown) => {
        if (url === '/v1/users') {
          return {
            data: {
              email: 'jane@example.com',
              userName: (payload as { userName: string }).userName,
              gender: (payload as { gender: 'M' | 'F' }).gender,
              dateOfBirth: (payload as { dateOfBirth: string }).dateOfBirth,
            },
          };
        }

        if (url === '/v1/profile') {
          return {
            data: payload,
          };
        }

        throw new Error(`Unhandled PATCH ${url}`);
      }),
      post: jest.fn(async (url: string, payload: unknown) => {
        if (url === '/v1/profile') {
          return {
            data: payload,
          };
        }

        if (url === '/v1/metrics') {
          return {
            data: {
              id: 12,
              heightCm: (payload as { heightCm: number }).heightCm,
              weightKg: (payload as { weightKg: number }).weightKg,
              bmi: 22.1,
              recordedAt: '2026-05-01T00:00:00.000Z',
            },
          };
        }

        throw new Error(`Unhandled POST ${url}`);
      }),
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };
  }

  beforeEach(() => {
    mockedAxios.create.mockImplementation(() => createClient() as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps profile overview and option data into the profile screen view model', async () => {
    const result = await fetchProfileScreenData({ accessToken: 'token-123' });

    expect(result).toMatchObject({
      basicInfo: {
        userName: 'Jane Doe',
        email: 'jane@example.com',
        gender: 'Male',
      },
      preferences: {
        dietType: 'Vegetarian',
        goal: 'Maintain Weight',
        cuisineType: 'Vietnamese',
        targetCalories: 1800,
        activityLevel: 'Average',
      },
      metrics: {
        weight: 58,
        height: 165,
        bmi: 21.3,
      },
      allergies: [{ id: 10, name: 'Peanut' }],
      favoriteIngredients: [{ id: 11, name: 'Salmon' }],
      isProfileIncomplete: false,
    });
    expect(result.basicInfo.dob).toBeInstanceOf(Date);
    expect(result.metrics.updatedAt).toBeInstanceOf(Date);
  });

  it('formats dateOfBirth as YYYY-MM-DD when updating the current user', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await updateCurrentUser({
      accessToken: 'token-123',
      payload: {
        userName: 'Jane Doe',
        gender: 'F',
        dateOfBirth: new Date('2000-01-02T09:45:00.000Z'),
      },
    });

    expect(client.patch).toHaveBeenCalledWith('/v1/users', {
      userName: 'Jane Doe',
      gender: 'F',
      dateOfBirth: '2000-01-02',
    });
    expect(result.dateOfBirth).toBeInstanceOf(Date);
  });

  it('returns a friendly validation error before calling the API for invalid user updates', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await updateCurrentUser({
      accessToken: 'token-123',
      payload: {
        userName: '   ',
        dateOfBirth: new Date('2000-01-02T09:45:00.000Z'),
      },
    }).catch((error) => {
      expect(error).toBeInstanceOf(FormValidationError);
      expect(error.message).toBe('Please review the highlighted fields.');
      expect(extractFieldErrors(error, ['userName'] as const)).toEqual({
        userName: 'Full name is required.',
      });
    });

    expect(client.patch).not.toHaveBeenCalled();
  });

  it('submits profile preference changes using id-based payloads', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await updateProfilePreferences({
      accessToken: 'token-123',
      payload: {
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: 1900,
        activityLevel: 'HIGH',
      },
    });

    expect(client.patch).toHaveBeenCalledWith('/v1/profile', {
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
      targetCalories: 1900,
      activityLevel: 'HIGH',
    });
  });

  it('supports creating initial profile preferences from the same adapter layer', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await createProfilePreferences({
      accessToken: 'token-123',
      payload: {
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
      },
    });

    expect(client.post).toHaveBeenCalledWith('/v1/profile', {
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
      targetCalories: null,
    });
  });

  it('returns a friendly validation error before calling the API for invalid preference payloads', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await createProfilePreferences({
      accessToken: 'token-123',
      payload: {
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: 0,
      },
    }).catch((error) => {
      expect(error).toBeInstanceOf(FormValidationError);
      expect(error.message).toBe('Please review the highlighted fields.');
      expect(extractFieldErrors(error, ['targetCalories'] as const)).toEqual({
        targetCalories: 'Target calories must be a positive number.',
      });
    });

    expect(client.post).not.toHaveBeenCalledWith('/v1/profile', expect.anything());
  });

  it('submits metric values and parses the returned metric response', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await createMetricEntry({
      accessToken: 'token-123',
      payload: {
        heightCm: 168,
        weightKg: 60,
      },
    });

    expect(client.post).toHaveBeenCalledWith('/v1/metrics', {
      heightCm: 168,
      weightKg: 60,
    });
    expect(result.recordedAt).toBeInstanceOf(Date);
  });

  it('parses structured ingredient conflict payloads for allergy and favorite flows', () => {
    const error = new ApiError({
      message: 'Ingredient selection conflicts with favorite ingredients.',
      status: 409,
      data: {
        statusCode: 409,
        message: 'Ingredient selection conflicts with favorite ingredients.',
        code: 'INGREDIENT_LIST_CONFLICT',
        conflictWith: 'favoriteIngredients',
        items: [{ id: 2, name: 'Milk' }],
      },
    });

    expect(getIngredientConflictResponse(error)).toEqual({
      statusCode: 409,
      message: 'Ingredient selection conflicts with favorite ingredients.',
      code: 'INGREDIENT_LIST_CONFLICT',
      conflictWith: 'favoriteIngredients',
      items: [{ id: 2, name: 'Milk' }],
    });
    expect(getIngredientConflictResponse(new Error('no conflict'))).toBeNull();
  });
});