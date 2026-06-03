import { Controller, Get, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { Response } from 'express';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll(@Res() res: Response) {
    const products = await this.productsService.findAll();
    return res.status(HttpStatus.OK).json(products);
  }

  // ── Get single product by slug ──
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string, @Res() res: Response) {
    const product = await this.productsService.findBySlug(slug);
    if (!product) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: 'Product not found' });
    }
    return res.status(HttpStatus.OK).json(product);
  }

  @Post('add')
  async addProduct(@Body() body: any, @Res() res: Response) {
    try {
      const product = await this.productsService.add(body);
      return res.status(HttpStatus.OK).json({ success: true, product });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('update')
  async updateProduct(@Body() body: any, @Res() res: Response) {
    try {
      const product = await this.productsService.update(parseInt(body.id), body);
      if (product) {
        return res.status(HttpStatus.OK).json({ success: true, product });
      }
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: 'Product not found' });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('delete')
  async deleteProduct(@Body() body: { id: any }, @Res() res: Response) {
    try {
      const product = await this.productsService.delete(parseInt(body.id));
      if (product) {
        return res.status(HttpStatus.OK).json({ success: true });
      }
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: 'Product not found' });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }
}
