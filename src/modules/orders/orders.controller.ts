import { Controller, Get, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { Response } from 'express';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders(
    @Query('email') email: string,
    @Query('customerId') customerId: string,
    @Res() res: Response,
  ) {
    try {
      if (email || customerId) {
        const orders = await this.ordersService.findByEmailOrCustomerId(email, customerId);
        return res.status(HttpStatus.OK).json(orders);
      }
      const orders = await this.ordersService.findAll();
      return res.status(HttpStatus.OK).json(orders);
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  @Post()
  async createOrder(@Body() body: any, @Res() res: Response) {
    try {
      const order = await this.ordersService.create(body);
      return res.status(HttpStatus.OK).json({ success: true, orderId: order.id });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  @Post('update-status')
  async updateStatus(@Body() body: { orderId: string; status: string }, @Res() res: Response) {
    try {
      const order = await this.ordersService.updateStatus(body.orderId, body.status);
      if (order) {
        return res.status(HttpStatus.OK).json({ success: true });
      }
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Order not found' });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }
}
