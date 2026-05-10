import {
    createEmptyMenuMealTimeGroups,
    sumMenuMealTimeNutrition,
    type MenuDifficulty,
    type MenuMealItem,
    type MenuMealTimeGroup,
    type MenuNutrition,
} from '@features/menu/utils/menu-meal-times';

export type TemplateDayState = {
    dayNumber: number;
    mealTimeGroups: MenuMealTimeGroup[];
    uiKey: string;
};

export const TEMPLATE_DAY_UI_KEY_PREFIX = 'template-day';

type TemplateMealItemsByTime = Partial<Record<MenuMealTimeGroup['mealTime'], MenuMealItem[]>>;

interface CreateTemplateDayOptions {
    dayNumber: number;
    mealsByTime?: TemplateMealItemsByTime;
    uiKey?: string;
}

interface CreateTemplateEditorMealItemOptions {
    cookTime?: string;
    dayNumber: number;
    difficulty?: MenuDifficulty;
    mealId: number;
    mealName: string;
    mealTime: MenuMealTimeGroup['mealTime'];
    menuItemId: number;
    nutritionPerServing: MenuNutrition;
    portionSize?: number;
}

export interface TemplateDraftSeed {
    description: string;
    days: TemplateDayState[];
    name: string;
}

export const SAMPLE_TEMPLATE_DESCRIPTION =
    'Focus on maximizing protein intake while keeping carbs low, great for muscle building.';

export const SAMPLE_TEMPLATE_NAME = 'High Protein Week';

const EMPTY_TEMPLATE_NUTRITION: MenuNutrition = {
    calories: 0,
    protein: 0,
    fiber: 0,
    fat: 0,
};

function createTemplateMealItem(config: {
    calories: number;
    cookTime: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    fat: number;
    fiber: number;
    mealId: number;
    mealName: string;
    mealTime: MenuMealTimeGroup['mealTime'];
    menuItemId: number;
    portionSize?: number;
    protein: number;
}) {
    const portionSize = config.portionSize ?? 1;

    return {
        menuItemId: config.menuItemId,
        mealId: config.mealId,
        mealName: config.mealName,
        date: '2026-05-08',
        mealTime: config.mealTime,
        portionSize,
        eated: false,
        cookTime: config.cookTime,
        difficulty: config.difficulty,
        nutritionPerServing: {
            calories: config.calories,
            protein: config.protein,
            fiber: config.fiber,
            fat: config.fat,
        },
    } satisfies MenuMealItem;
}

export function cloneMealTimeGroups(groups: readonly MenuMealTimeGroup[]) {
    return groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
            ...item,
            nutritionPerServing: {
                ...item.nutritionPerServing,
            },
        })),
    }));
}

export function cloneTemplateDays(days: readonly TemplateDayState[]) {
    return days.map((day) => ({
        ...day,
        mealTimeGroups: cloneMealTimeGroups(day.mealTimeGroups),
    }));
}

export function createTemplateDayUiKey(sequence: number) {
    return `${TEMPLATE_DAY_UI_KEY_PREFIX}-${sequence}`;
}

export function renumberTemplateDays(days: readonly TemplateDayState[]) {
    return days.map((day, index) => ({
        ...day,
        dayNumber: index + 1,
    }));
}

export function calculateTemplateNutrition(groups: readonly MenuMealTimeGroup[]) {
    const items = groups.flatMap((group) => group.items);

    return items.length > 0 ? sumMenuMealTimeNutrition(items) : EMPTY_TEMPLATE_NUTRITION;
}

export function createTemplateEditorMealItem({
    cookTime,
    dayNumber,
    difficulty,
    mealId,
    mealName,
    mealTime,
    menuItemId,
    nutritionPerServing,
    portionSize = 1,
}: CreateTemplateEditorMealItemOptions): MenuMealItem {
    return {
        menuItemId,
        mealId,
        mealName,
        date: `Day ${dayNumber}`,
        mealTime,
        portionSize,
        eated: false,
        cookTime,
        difficulty,
        nutritionPerServing: {
            ...nutritionPerServing,
        },
    };
}

export function getNextTemplateMealItemId(days: readonly TemplateDayState[]) {
    return (
        days.flatMap((day) => day.mealTimeGroups.flatMap((group) => group.items))
            .reduce((highestMenuItemId, item) => Math.max(highestMenuItemId, item.menuItemId), 0) + 1
    );
}

export function createTemplateDay({
    dayNumber,
    mealsByTime = {},
    uiKey = createTemplateDayUiKey(dayNumber),
}: CreateTemplateDayOptions): TemplateDayState {
    return {
        dayNumber,
        mealTimeGroups: createEmptyMenuMealTimeGroups().map((group) => ({
            ...group,
            items: mealsByTime[group.mealTime]?.map((item) => ({
                ...item,
                nutritionPerServing: {
                    ...item.nutritionPerServing,
                },
            })) ?? [],
        })),
        uiKey,
    };
}

export function createSampleTemplateDays() {
    return [
        createTemplateDay({
            dayNumber: 1,
            mealsByTime: {
            BREAKFAST: [
                createTemplateMealItem({
                    menuItemId: 101,
                    mealId: 11,
                    mealName: 'Avocado Toast',
                    mealTime: 'BREAKFAST',
                    calories: 540,
                    protein: 12,
                    fiber: 10,
                    fat: 32,
                    cookTime: '30 min',
                    difficulty: 'Easy',
                }),
                createTemplateMealItem({
                    menuItemId: 102,
                    mealId: 12,
                    mealName: 'Scrambled Eggs',
                    mealTime: 'BREAKFAST',
                    calories: 290,
                    protein: 22,
                    fiber: 2,
                    fat: 18,
                    cookTime: '20 min',
                    difficulty: 'Easy',
                }),
            ],
            },
        }),
        createTemplateDay({
            dayNumber: 2,
            mealsByTime: {
            LUNCH: [
                createTemplateMealItem({
                    menuItemId: 201,
                    mealId: 21,
                    mealName: 'Chicken Rice Bowl',
                    mealTime: 'LUNCH',
                    calories: 720,
                    protein: 40,
                    fiber: 8,
                    fat: 24,
                    cookTime: '35 min',
                    difficulty: 'Medium',
                }),
            ],
            DINNER: [
                createTemplateMealItem({
                    menuItemId: 202,
                    mealId: 22,
                    mealName: 'Salmon with Greens',
                    mealTime: 'DINNER',
                    calories: 610,
                    protein: 36,
                    fiber: 9,
                    fat: 28,
                    cookTime: '30 min',
                    difficulty: 'Medium',
                }),
            ],
            },
        }),
        createTemplateDay({
            dayNumber: 3,
            mealsByTime: {
            BREAKFAST: [
                createTemplateMealItem({
                    menuItemId: 301,
                    mealId: 31,
                    mealName: 'Berry Yogurt Bowl',
                    mealTime: 'BREAKFAST',
                    calories: 380,
                    protein: 18,
                    fiber: 7,
                    fat: 12,
                    cookTime: '15 min',
                    difficulty: 'Easy',
                }),
            ],
            LUNCH: [
                createTemplateMealItem({
                    menuItemId: 302,
                    mealId: 32,
                    mealName: 'Pesto Pasta',
                    mealTime: 'LUNCH',
                    calories: 670,
                    protein: 19,
                    fiber: 6,
                    fat: 26,
                    cookTime: '25 min',
                    difficulty: 'Medium',
                }),
            ],
            DINNER: [
                createTemplateMealItem({
                    menuItemId: 303,
                    mealId: 33,
                    mealName: 'Tofu Stir Fry',
                    mealTime: 'DINNER',
                    calories: 560,
                    protein: 27,
                    fiber: 11,
                    fat: 20,
                    cookTime: '25 min',
                    difficulty: 'Medium',
                }),
            ],
            },
        }),
    ];
}

export function createTemplateDraftSeed(overrides?: Partial<TemplateDraftSeed>): TemplateDraftSeed {
    return {
        name: overrides?.name ?? SAMPLE_TEMPLATE_NAME,
        description: overrides?.description ?? SAMPLE_TEMPLATE_DESCRIPTION,
        days: overrides?.days ? cloneTemplateDays(overrides.days) : createSampleTemplateDays(),
    };
}