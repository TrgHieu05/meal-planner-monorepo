import axios from 'axios';

import {
  buildTemplateEditDayPlan,
  buildApplyTemplatePayload,
  fetchTemplateEditorData,
  fetchTemplateListScreenData,
  mapTemplateDaysToUpsertRequests,
} from './template.api';
import { createTemplateDay } from '../utils/template-screen-data';

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
  delete: jest.Mock;
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  get: jest.Mock;
  interceptors: {
    response: {
      use: jest.Mock;
    };
  };
  patch: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
};

describe('template.api', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  function createClient(): MockClient {
    return {
      get: jest.fn(async (url: string) => {
        if (url === '/v1/meal-templates') {
          return {
            data: {
              list: [
                {
                  id: '550e8400-e29b-41d4-a716-446655440001',
                  name: 'High Protein Week',
                  description: 'Protein focused plan',
                  dayCount: 3,
                  nutritionTotal: {
                    calories: 1750,
                    protein: 85,
                    fiber: 22.5,
                    fat: 50,
                  },
                },
              ],
            },
          };
        }

        if (url === '/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001') {
          return {
            data: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'High Protein Week',
              description: 'Protein focused plan',
              nutritionTotal: {
                calories: 1750,
                protein: 85,
                fiber: 22.5,
                fat: 50,
              },
              days: [
                {
                  dayNumber: 1,
                  nutritionTotal: {
                    calories: 600,
                    protein: 30,
                    fiber: 8,
                    fat: 16,
                  },
                  meals: {
                    BREAKFAST: [
                      {
                        itemId: '550e8400-e29b-41d4-a716-446655440010',
                        mealId: 11,
                        mealName: 'Avocado Toast',
                        portionSize: 1,
                        nutritionPerServing: {
                          calories: 320,
                          protein: 12,
                          fiber: 6,
                          fat: 14,
                        },
                      },
                    ],
                    LUNCH: [],
                    DINNER: [],
                  },
                },
                {
                  dayNumber: 2,
                  nutritionTotal: {
                    calories: 700,
                    protein: 35,
                    fiber: 9,
                    fat: 20,
                  },
                  meals: {
                    BREAKFAST: [],
                    LUNCH: [
                      {
                        itemId: '550e8400-e29b-41d4-a716-446655440011',
                        mealId: 21,
                        mealName: 'Chicken Rice Bowl',
                        portionSize: 1.5,
                        nutritionPerServing: {
                          calories: 400,
                          protein: 24,
                          fiber: 5,
                          fat: 10,
                        },
                      },
                    ],
                    DINNER: [],
                  },
                },
              ],
            },
          };
        }

        throw new Error(`Unhandled GET ${url}`);
      }),
      post: jest.fn(),
      patch: jest.fn(),
      put: jest.fn(),
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

  it('maps template list API data into list card screen data with nutrition summary text', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await fetchTemplateListScreenData({ accessToken: 'token-123' });

    expect(client.get).toHaveBeenCalledWith('/v1/meal-templates');
    expect(result).toEqual([
      {
        templateId: '550e8400-e29b-41d4-a716-446655440001',
        title: 'High Protein Week',
        description: 'Protein focused plan',
        dayCount: 3,
        nutritionTotal: {
          calories: 1750,
          protein: 85,
          fiber: 22.5,
          fat: 50,
        },
        nutritionSummary: '1750 kcal | 85g P | 22.5g Fib | 50g F',
      },
    ]);
  });

  it('maps template detail API data into editor state with dayNumber and stable ui keys', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await fetchTemplateEditorData({
      accessToken: 'token-123',
      templateId: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(client.get).toHaveBeenCalledWith('/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001');
    expect(result.initialTemplateName).toBe('High Protein Week');
    expect(result.initialDescription).toBe('Protein focused plan');
    expect(result.initialDays).toMatchObject([
      {
        dayNumber: 1,
        uiKey: 'template-day-1',
      },
      {
        dayNumber: 2,
        uiKey: 'template-day-2',
      },
    ]);
    expect(result.initialDays[0]?.mealTimeGroups[0]?.items[0]).toMatchObject({
      menuItemId: 1,
      mealId: 11,
      mealName: 'Avocado Toast',
      date: 'Day 1',
      mealTime: 'BREAKFAST',
      portionSize: 1,
      eated: false,
      nutritionPerServing: {
        calories: 320,
        protein: 12,
        fiber: 6,
        fat: 14,
      },
    });
    expect(result.initialDays[1]?.mealTimeGroups[1]?.items[0]).toMatchObject({
      menuItemId: 2,
      mealId: 21,
      mealName: 'Chicken Rice Bowl',
      date: 'Day 2',
      mealTime: 'LUNCH',
      portionSize: 1.5,
    });
  });

  it('builds apply payloads and day upsert payloads from mobile template state', () => {
    const applyPayload = buildApplyTemplatePayload({
      selectedDate: new Date('2026-05-10T08:30:00.000Z'),
      replaceExistingMeals: false,
    });

    const requests = mapTemplateDaysToUpsertRequests([
      createTemplateDay({
        dayNumber: 1,
        mealsByTime: {
          BREAKFAST: [
            {
              menuItemId: 1,
              mealId: 11,
              mealName: 'Avocado Toast',
              date: 'Day 1',
              mealTime: 'BREAKFAST',
              portionSize: 1,
              eated: false,
              nutritionPerServing: {
                calories: 320,
                protein: 12,
                fiber: 6,
                fat: 14,
              },
            },
          ],
        },
      }),
    ]);

    expect(applyPayload).toEqual({
      startDate: '2026-05-10',
      replaceExistingMeals: false,
    });
    expect(requests).toEqual([
      {
        dayNumber: 1,
        payload: {
          meals: {
            BREAKFAST: [{ mealId: 11, portionSize: 1 }],
            LUNCH: [],
            DINNER: [],
          },
        },
      },
    ]);
  });

  it('builds an edit-day plan by upserting current days and deleting removed original day numbers', () => {
    const plan = buildTemplateEditDayPlan({
      initialDays: [
        { dayNumber: 1 },
        { dayNumber: 2 },
        { dayNumber: 3 },
      ],
      currentDays: [
        createTemplateDay({
          dayNumber: 1,
          mealsByTime: {
            BREAKFAST: [
              {
                menuItemId: 1,
                mealId: 11,
                mealName: 'Avocado Toast',
                date: 'Day 1',
                mealTime: 'BREAKFAST',
                portionSize: 1,
                eated: false,
                nutritionPerServing: {
                  calories: 320,
                  protein: 12,
                  fiber: 6,
                  fat: 14,
                },
              },
            ],
          },
        }),
        createTemplateDay({
          dayNumber: 2,
          mealsByTime: {
            DINNER: [
              {
                menuItemId: 2,
                mealId: 33,
                mealName: 'Tofu Stir Fry',
                date: 'Day 2',
                mealTime: 'DINNER',
                portionSize: 1.5,
                eated: false,
                nutritionPerServing: {
                  calories: 560,
                  protein: 27,
                  fiber: 11,
                  fat: 20,
                },
              },
            ],
          },
        }),
      ],
    });

    expect(plan.dayNumbersToDelete).toEqual([3]);
    expect(plan.daysToUpsert).toEqual([
      {
        dayNumber: 1,
        payload: {
          meals: {
            BREAKFAST: [{ mealId: 11, portionSize: 1 }],
            LUNCH: [],
            DINNER: [],
          },
        },
      },
      {
        dayNumber: 2,
        payload: {
          meals: {
            BREAKFAST: [],
            LUNCH: [],
            DINNER: [{ mealId: 33, portionSize: 1.5 }],
          },
        },
      },
    ]);
  });
});