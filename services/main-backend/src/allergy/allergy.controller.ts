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
  getAllergy(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.allergyService.getAllergy(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật danh sách allergy của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật allergy thành công' })
  @ApiResponse({ status: 422, description: 'Payload không hợp lệ' })
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
      throw new UnprocessableEntityException({ message: 'Invalid x-user-id' });
    }
    return parsed.data;
  }

  private parseAllergyUpdate(body: unknown) {
    const parsed = AllergyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error);
    }
    return parsed.data;
  }
}
