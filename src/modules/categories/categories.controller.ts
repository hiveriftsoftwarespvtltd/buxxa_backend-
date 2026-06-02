import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type { Response } from 'express';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll(@Res() res: Response) {
    const categories = await this.categoriesService.findAll();
    return res.status(HttpStatus.OK).json(categories);
  }

  @Post('add')
  async addCategory(@Body() body: any, @Res() res: Response) {
    try {
      const category = await this.categoriesService.add(body);
      return res.status(HttpStatus.OK).json({ success: true, category });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }
}
