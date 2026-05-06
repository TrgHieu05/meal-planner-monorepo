import type { DifficultyFilter } from '@meal/shared/types/meal-search'

export type MealDifficultyFilter = DifficultyFilter
export type MealCookingTimeFilter = {
	min: number
	max: number
}

export const MEAL_COOKING_TIME_MIN = 2
export const MEAL_COOKING_TIME_MAX = 120

export type MealFilters = {
	difficulty: MealDifficultyFilter | null
	cookingTime: MealCookingTimeFilter
}

function isFiniteMealCookingTimeValue(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function createDefaultMealCookingTimeFilter(): MealCookingTimeFilter {
	return {
		min: MEAL_COOKING_TIME_MIN,
		max: MEAL_COOKING_TIME_MAX,
	}
}

function clampMealCookingTimeValue(value: number) {
	return Math.min(MEAL_COOKING_TIME_MAX, Math.max(MEAL_COOKING_TIME_MIN, value))
}

export function normalizeMealCookingTimeFilter(
	values: readonly number[],
): MealCookingTimeFilter {
	const [rawStart = MEAL_COOKING_TIME_MIN, rawEnd = MEAL_COOKING_TIME_MAX] = values
	const start = Math.min(rawStart, rawEnd)
	const end = Math.max(rawStart, rawEnd)

	return {
		min: clampMealCookingTimeValue(Math.round(start)),
		max: clampMealCookingTimeValue(Math.round(end)),
	}
}

export function sanitizeMealCookingTimeFilter(
	filter: Partial<MealCookingTimeFilter> | null | undefined,
): MealCookingTimeFilter {
	if (!filter) {
		return createDefaultMealCookingTimeFilter()
	}

	const min = isFiniteMealCookingTimeValue(filter.min)
		? filter.min
		: MEAL_COOKING_TIME_MIN
	const max = isFiniteMealCookingTimeValue(filter.max)
		? filter.max
		: MEAL_COOKING_TIME_MAX

	return normalizeMealCookingTimeFilter([min, max])
}

export function areMealCookingTimeFiltersEqual(
	left: MealCookingTimeFilter,
	right: MealCookingTimeFilter,
) {
	return left.min === right.min && left.max === right.max
}

export function isDefaultMealCookingTimeFilter(
	filter: MealCookingTimeFilter,
) {
	const normalizedFilter = sanitizeMealCookingTimeFilter(filter)

	return (
		normalizedFilter.min === MEAL_COOKING_TIME_MIN &&
		normalizedFilter.max === MEAL_COOKING_TIME_MAX
	)
}

export function createEmptyMealFilters(): MealFilters {
	return {
		difficulty: null,
		cookingTime: createDefaultMealCookingTimeFilter(),
	}
}

export function cloneMealFilters(filters: MealFilters): MealFilters {
	return {
		difficulty: filters.difficulty,
		cookingTime: sanitizeMealCookingTimeFilter(filters.cookingTime),
	}
}

export function hasAppliedMealFilters(filters: MealFilters) {
	return (
		filters.difficulty !== null ||
		!isDefaultMealCookingTimeFilter(filters.cookingTime)
	)
}