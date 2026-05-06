import axios from 'axios';

import {
  fetchMealDetailViewModel,
  fetchMealSearchResults,
  fetchMealSearchScreenData,
  formatCookTimeLabel,
} from './meal.api';

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

describe('meal.api', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  function createClient(): MockClient {
    return {
      get: jest.fn(async (url: string) => {
        if (url === '/v1/meals') {
          return {
            data: {
              list: [
                {
                  id: 7,
                  name: 'Turkey Quinoa Salad',
                  meal_image_key: null,
                  difficulty: 'easy',
                  cook_time_min: 18,
                  total_calories: 340,
                  total_protein: 27,
                  total_fat: 11,
                  total_fiber: 7.5,
                  score: 2,
                },
              ],
              page: 1,
              pageSize: 10,
              total: 1,
              hasMore: false,
            },
          };
        }

        if (url === '/v1/meals/7') {
          return {
            data: {
              id: 7,
              name: 'Turkey Quinoa Salad',
              meal_image_key: null,
              description: 'Bright lemon dressing over quinoa and turkey.',
              cuisine_type: {
                id: 3,
                name: 'Mediterranean',
                description: null,
              },
              difficulty: 'hard',
              cook_time_min: 60,
              total_calories: 340,
              total_protein: 27,
              total_fat: 11,
              total_fiber: 7.5,
              ingredients: [
                { id: 1, name: 'Turkey', quantity: 120 },
                { id: 2, name: 'Quinoa', quantity: 0.75 },
              ],
            },
          };
        }

        throw new Error(`Unhandled GET ${url}`);
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

  it('serializes meal search query params and parses the shared response contract', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await fetchMealSearchResults({
      accessToken: 'token-123',
      query: {
        q: '  turkey  ',
        difficulty: 'easy',
        allergies: 'milk,peanut',
        cookTimeMin: 2,
        cookTimeMax: 30,
      },
    });

    expect(client.get).toHaveBeenCalledWith('/v1/meals', {
      params: {
        q: 'turkey',
        difficulty: 'easy',
        allergies: 'milk,peanut',
        cookTimeMin: 2,
        cookTimeMax: 30,
        page: 1,
        pageSize: 10,
      },
    });
    expect(result.list[0]?.name).toBe('Turkey Quinoa Salad');
  });

  it('omits the q parameter when requesting the default paginated list', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await fetchMealSearchResults({
      accessToken: 'token-123',
    });

    expect(client.get).toHaveBeenCalledWith('/v1/meals', {
      params: {
        page: 1,
        pageSize: 10,
      },
    });
  });

  it('maps meal search data into a mobile card view model with formatted labels', async () => {
    const result = await fetchMealSearchScreenData({
      accessToken: 'token-123',
      query: { q: 'turkey' },
    });

    expect(result).toEqual({
      list: [
        {
          mealId: 7,
          mealName: 'Turkey Quinoa Salad',
          mealImageKey: null,
          cookTime: '18 mins',
          difficulty: 'Easy',
          totalCalories: '340',
          totalProtein: '27',
          totalFiber: '7.5',
          totalFat: '11',
          score: 2,
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      hasMore: false,
    });
  });

  it('maps meal detail data into a mobile detail view model with quantity labels', async () => {
    const result = await fetchMealDetailViewModel({
      accessToken: 'token-123',
      mealId: 7,
    });

    expect(result).toEqual({
      mealId: 7,
      mealName: 'Turkey Quinoa Salad',
      mealImageKey: null,
      description: 'Bright lemon dressing over quinoa and turkey.',
      cuisineTypeName: 'Mediterranean',
      difficulty: 'Hard',
      cookTime: '1 hour',
      totalCalories: '340',
      totalProtein: '27',
      totalFiber: '7.5',
      totalFat: '11',
      ingredients: [
        { id: 1, name: 'Turkey', quantity: 120, quantityLabel: '120' },
        { id: 2, name: 'Quinoa', quantity: 0.75, quantityLabel: '0.75' },
      ],
    });
  });

  it('fails fast for an invalid search query before calling the API', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await expect(
      fetchMealSearchResults({
        accessToken: 'token-123',
        query: {
          cookTimeMin: 30,
          cookTimeMax: 2,
        },
      }),
    ).rejects.toThrow('Unable to load meals right now.');

    expect(client.get).not.toHaveBeenCalled();
  });

  it('formats cook time labels for hour-based durations', () => {
    expect(formatCookTimeLabel(75)).toBe('1 hour 15 mins');
    expect(formatCookTimeLabel(120)).toBe('2 hours');
  });
});