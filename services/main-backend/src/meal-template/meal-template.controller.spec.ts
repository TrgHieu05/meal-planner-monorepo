import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { MealTemplateController } from './meal-template.controller';
import { MealTemplateService } from './meal-template.service';

describe('MealTemplateController', () => {
  let controller: MealTemplateController;
  let service: any;

  beforeEach(() => {
    service = {
      createTemplate: jest.fn(),
      getTemplates: jest.fn(),
      getTemplateDetail: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      upsertDay: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      deleteDay: jest.fn(),
    };
    controller = new MealTemplateController(service as unknown as MealTemplateService);
  });

  describe('createTemplate', () => {
    it('throws BadRequest if payload invalid', async () => {
      await expect(
        controller.createTemplate({ user: { id: 'u1' } }, { name: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls service if payload valid', async () => {
      await controller.createTemplate({ user: { id: 'u1' } }, { name: 'T1' });
      expect(service.createTemplate).toHaveBeenCalledWith('u1', { name: 'T1' });
    });
  });

  describe('upsertDay', () => {
    it('throws UnprocessableEntity if dayNumber invalid', async () => {
      await expect(
        controller.upsertDay({ user: { id: 'u1' } }, 't1', 'abc', {}),
      ).rejects.toThrow(UnprocessableEntityException);
      await expect(
        controller.upsertDay({ user: { id: 'u1' } }, 't1', '0', {}),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws BadRequest if meals invalid', async () => {
      await expect(
        controller.upsertDay({ user: { id: 'u1' } }, 't1', '1', { meals: { BREAKFAST: [{ mealId: 'not-int', portionSize: 1 }] } }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls service if valid', async () => {
      await controller.upsertDay({ user: { id: 'u1' } }, 't1', '1', { meals: { BREAKFAST: [{ mealId: 10, portionSize: 1 }] } });
      expect(service.upsertDay).toHaveBeenCalledWith('u1', 't1', 1, { meals: { BREAKFAST: [{ mealId: 10, portionSize: 1 }] } });
    });
  });
});
