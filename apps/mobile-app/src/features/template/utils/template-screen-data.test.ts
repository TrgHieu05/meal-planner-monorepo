import { describe, expect, it } from '@jest/globals';

import {
  createTemplateDay,
  createTemplateDayUiKey,
  createTemplateDraftSeed,
  renumberTemplateDays,
} from './template-screen-data';

describe('template-screen-data helpers', () => {
  it('creates an empty day with a real day number and stable default ui key', () => {
    const day = createTemplateDay({ dayNumber: 1 });

    expect(day).toMatchObject({
      dayNumber: 1,
      uiKey: createTemplateDayUiKey(1),
    });
    expect(day.mealTimeGroups.flatMap((group) => group.items)).toEqual([]);
  });

  it('renumbers days sequentially without changing their ui keys', () => {
    const days = [
      createTemplateDay({ dayNumber: 1, uiKey: 'keep-1' }),
      createTemplateDay({ dayNumber: 3, uiKey: 'keep-3' }),
    ];

    expect(renumberTemplateDays(days)).toEqual([
      expect.objectContaining({ dayNumber: 1, uiKey: 'keep-1' }),
      expect.objectContaining({ dayNumber: 2, uiKey: 'keep-3' }),
    ]);
  });

  it('supports create flow starting from a single empty day instead of sample days', () => {
    const draft = createTemplateDraftSeed({
      name: '',
      description: '',
      days: [createTemplateDay({ dayNumber: 1 })],
    });

    expect(draft.days).toHaveLength(1);
    expect(draft.days[0]).toMatchObject({
      dayNumber: 1,
      uiKey: createTemplateDayUiKey(1),
    });
    expect(draft.days[0]?.mealTimeGroups.flatMap((group) => group.items)).toEqual([]);
  });
});