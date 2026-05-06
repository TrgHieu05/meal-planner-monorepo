import { describe, expect, it } from '@jest/globals'

import {
	createEmptyMealFilters,
	hasAppliedMealFilters,
	isDefaultMealCookingTimeFilter,
	MEAL_COOKING_TIME_MAX,
	MEAL_COOKING_TIME_MIN,
	normalizeMealCookingTimeFilter,
	sanitizeMealCookingTimeFilter,
} from './meal-filters'

describe('MealFilterSheet helpers', () => {
	it('uses the full slider range for empty filters', () => {
		const filters = createEmptyMealFilters()

		expect(filters.cookingTime).toEqual({
			min: MEAL_COOKING_TIME_MIN,
			max: MEAL_COOKING_TIME_MAX,
		})
		expect(isDefaultMealCookingTimeFilter(filters.cookingTime)).toBe(true)
		expect(hasAppliedMealFilters(filters)).toBe(false)
	})

	it('normalizes slider values into a sorted in-range filter', () => {
		expect(normalizeMealCookingTimeFilter([95, 20])).toEqual({
			min: 20,
			max: 95,
		})

		expect(normalizeMealCookingTimeFilter([160, -4])).toEqual({
			min: MEAL_COOKING_TIME_MIN,
			max: MEAL_COOKING_TIME_MAX,
		})
	})

	it('sanitizes malformed cooking time ranges before they reach the query layer', () => {
		expect(
			sanitizeMealCookingTimeFilter({
				min: Number.NaN,
				max: 45,
			}),
		).toEqual({
			min: MEAL_COOKING_TIME_MIN,
			max: 45,
		})

		expect(
			sanitizeMealCookingTimeFilter({
				min: Number.POSITIVE_INFINITY,
				max: Number.NEGATIVE_INFINITY,
			}),
		).toEqual({
			min: MEAL_COOKING_TIME_MIN,
			max: MEAL_COOKING_TIME_MAX,
		})
	})

	it('treats narrowed cooking time ranges as applied filters', () => {
		expect(
			hasAppliedMealFilters({
				difficulty: null,
				cookingTime: {
					min: 15,
					max: 45,
				},
			}),
		).toBe(true)
	})
})