import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';

@Controller('api/v1/templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.templateService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('type') type?: string,
  ): Promise<TemplateResponseDto[]> {
    if (type) {
      return this.templateService.findByType(userId, type);
    }
    return this.templateService.findAll(userId);
  }

  @Get(':id')
  async findById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<TemplateResponseDto> {
    return this.templateService.findById(userId, id);
  }

  @Post(':id/apply')
  async apply(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ApplyTemplateDto,
  ): Promise<{ blocks: unknown[] }> {
    return this.templateService.apply(userId, id, dto.date);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.templateService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    return this.templateService.softDelete(userId, id);
  }
}