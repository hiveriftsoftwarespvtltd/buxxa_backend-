import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { BrandsService } from './brands.service';
import type { Response } from 'express';

@Controller('api/brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async getAll(@Res() res: Response) {
    const brands = await this.brandsService.findAll();
    return res.status(HttpStatus.OK).json(brands);
  }

  @Post('add')
  async addBrand(@Body() body: any, @Res() res: Response) {
    try {
      const brand = await this.brandsService.add(body);
      return res.status(HttpStatus.OK).json({ success: true, brand });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }
}
