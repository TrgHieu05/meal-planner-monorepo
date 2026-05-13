import axios from 'axios';

import {
  createMenuItem,
  fetchMenuScreenData,
} from './menu.api';

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
                    mealImageKey: 'meals/7/cover',
                    mealImageUrls: {
                      card: 'https://example.com/meals/7/cover/card',
                      detail: 'https://example.com/meals/7/cover/detail',
                      original: 'https://example.com/meals/7/cover/original',
                    },
                    portionSize: 1.25,
                    eated: false,
                    nutritionPerServing: {
                      calories: 340,
                      protein: 27,
                      fiber: 7.5,
                      fat: 11,
                    },
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('maps menu day data into numeric mealId menu groups without loading meal details per item', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await fetchMenuScreenData({
      accessToken: 'token-123',
      date: '2026-05-06',
    });

    expect(client.get).toHaveBeenCalledWith('/v1/menus/day/2026-05-06');
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
            mealImageKey: 'meals/7/cover',
            mealCardImageUrl: 'https://example.com/meals/7/cover/card',
            date: '06.05.2026',
            mealTime: 'LUNCH',
            portionSize: 1.25,
            eated: false,
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