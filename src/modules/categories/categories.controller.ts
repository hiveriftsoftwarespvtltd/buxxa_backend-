import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type { Response } from 'express';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll(@Res() res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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

  @Post('update')
  async updateCategory(@Body() body: any, @Res() res: Response) {
    try {
      const category = await this.categoriesService.update(parseInt(body.id), body);
      if (category) {
        return res.status(HttpStatus.OK).json({ success: true, category });
      }
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Category not found' });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  @Post('delete')
  async deleteCategory(@Body() body: { id: any }, @Res() res: Response) {
    try {
      const category = await this.categoriesService.delete(parseInt(body.id));
      if (category) {
        return res.status(HttpStatus.OK).json({ success: true });
      }
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Category not found' });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }
}
