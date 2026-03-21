import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllergyService } from './allergy.service';
import { AllergyUpdateSchema } from '@meal/shared/types/allergy';
import { UuidSchema } from '@meal/shared/types/common';

@ApiTags('Allergy')
@Controller('v1/allergies')
export class AllergyController {
  constructor(private readonly allergyService: AllergyService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách allergy của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách allergy' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 422, description: 'Invalid request header.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getAllergy(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.allergyService.getAllergy(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật danh sách allergy của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật allergy thành công' })
  @ApiResponse({ status: 404, description: 'User or ingredient not found.' })
  @ApiResponse({
    status: 409,
    description: 'Ingredient conflict with favorite list.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request header or payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  updateAllergy(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: unknown,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseAllergyUpdate(body);
    return this.allergyService.updateAllergy(userId, payload);
  }

  private parseUserId(userIdHeader?: string) {
    const parsed = UuidSchema.safeParse(userIdHeader);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Header "x-user-id" must be a valid UUID.',
      });
    }
    return parsed.data;
  }

  private parseAllergyUpdate(body: unknown) {
    const parsed = AllergyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for allergy update.',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
