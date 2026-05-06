import axios from 'axios';

import {
  createMenuItem,
  fetchMenuScreenData,
} from './menu.api';

import { fetchMealDetail } from '@features/meal/api/meal.api';

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

jest.mock('@features/meal/api/meal.api', () => ({
  fetchMealDetail: jest.fn(),
  formatCookTimeLabel: (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }

    return `${hours === 1 ? '1 hour' : `${hours} hours`} ${remainingMinutes} mins`;
  },
}));

type MockClient = {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
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

describe('menu.api', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedFetchMealDetail = fetchMealDetail as jest.MockedFunction<typeof fetchMealDetail>;

  function createClient(): MockClient {
    return {
      get: jest.fn(async (url: string) => {
        if (url === '/v1/menus/day/2026-05-06') {
          return {
            data: {
              date: '2026-05-06',
              hasMenu: true,
              nutritionTotal: {
                calories: 640,
                protein: 49,
                fiber: 11.5,
                fat: 20,
              },
              meals: {
                BREAKFAST: [],
                LUNCH: [
                  {
                    menuItemId: 17,
                    mealId: 7,
                    mealName: 'Turkey Quinoa Salad',
                    portionSize: 1.25,
                    eated: false,
                  },
                ],
                DINNER: [],
              },
            },
          };
        }

        throw new Error(`Unhandled GET ${url}`);
      }),
      post: jest.fn(async (url: string, payload: unknown) => {
        if (url === '/v1/menu-items') {
          return {
            data: {
              id: 99,
              menuId: 55,
              mealId: (payload as { mealId: number }).mealId,
              mealTime: (payload as { mealTime: string }).mealTime,
              eated: false,
              portionSize: (payload as { portionSize: number }).portionSize,
            },
          };
        }

        throw new Error(`Unhandled POST ${url}`);
      }),
      patch: jest.fn(),
      delete: jest.fn(),
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
    mockedFetchMealDetail.mockResolvedValue({
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
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps menu day data into numeric mealId menu groups enriched by meal details', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await fetchMenuScreenData({
      accessToken: 'token-123',
      date: '2026-05-06',
    });

    expect(client.get).toHaveBeenCalledWith('/v1/menus/day/2026-05-06');
    expect(mockedFetchMealDetail).toHaveBeenCalledWith({
      accessToken: 'token-123',
      apiBaseUrl: undefined,
      mealId: 7,
    });
    expect(result.mealTimeGroups).toEqual([
      {
        mealTime: 'BREAKFAST',
        label: 'Breakfast',
        timeRange: '7-9 AM',
        items: [],
      },
      {
        mealTime: 'LUNCH',
        label: 'Lunch',
        timeRange: '12-2 PM',
        items: [
          {
            menuItemId: 17,
            mealId: 7,
            mealName: 'Turkey Quinoa Salad',
            date: '06.05.2026',
            mealTime: 'LUNCH',
            portionSize: 1.25,
            eated: false,
            cookTime: '1 hour',
            difficulty: 'Hard',
            nutritionPerServing: {
              calories: 340,
              protein: 27,
              fiber: 7.5,
              fat: 11,
            },
          },
        ],
      },
      {
        mealTime: 'DINNER',
        label: 'Dinner',
        timeRange: '6-8 PM',
        items: [],
      },
    ]);
  });

  it('creates a menu item with numeric mealId payload', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await createMenuItem({
      accessToken: 'token-123',
      payload: {
        date: '2026-05-06',
        mealId: 7,
        mealTime: 'DINNER',
        portionSize: 1.5,
      },
    });

    expect(client.post).toHaveBeenCalledWith('/v1/menu-items', {
      date: '2026-05-06',
      mealId: 7,
      mealTime: 'DINNER',
      portionSize: 1.5,
    });
    expect(result).toEqual({
      id: 99,
      menuId: 55,
      mealId: 7,
      mealTime: 'DINNER',
      eated: false,
      portionSize: 1.5,
    });
  });
});