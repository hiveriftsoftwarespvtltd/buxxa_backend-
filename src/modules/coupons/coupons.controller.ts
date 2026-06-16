import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import type { Response } from 'express';

@Controller('api/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  async getCoupons(@Res() res: Response) {
    try {
      const result = await this.couponsService.findAll();
      return res.status(HttpStatus.OK).json(result);
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Failed to retrieve coupons.',
      });
    }
  }

  @Post('add')
  async addCoupon(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.couponsService.create(body);
      return res.status(HttpStatus.OK).json({ success: true, coupon: result });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: err.message || 'Failed to create coupon.',
      });
    }
  }

  @Post('delete')
  async deleteCoupon(@Body() body: { code: string }, @Res() res: Response) {
    try {
      const result = await this.couponsService.delete(body.code);
      if (result) {
        return res.status(HttpStatus.OK).json({ success: true, message: 'Coupon deleted successfully.' });
      } else {
        return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Coupon not found.' });
      }
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Failed to delete coupon.',
      });
    }
  }

  @Post('validate')
  async validateCoupon(@Body() body: { code: string; subtotal: number }, @Res() res: Response) {
    try {
      const result = await this.couponsService.validate(body.code, body.subtotal);
      if (result.success) {
        return res.status(HttpStatus.OK).json(result);
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
      }
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Failed to validate coupon.',
      });
    }
  }

  @Post('redeem')
  async redeemCoupon(@Body() body: { code: string; email?: string }, @Res() res: Response) {
    try {
      const result = await this.couponsService.validateAndRedeem(body.code, body.email);
      if (result.success) {
        return res.status(HttpStatus.OK).json(result);
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
      }
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'An error occurred during coupon verification.',
      });
    }
  }
}
