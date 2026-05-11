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

const EMPTY_TEMPLATE_NUTRITION: MenuNutrition = {
    calories: 0,
    protein: 0,
    fiber: 0,
    fat: 0,
};

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
