import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import type { Response } from 'express';

@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getAll(@Res() res: Response) {
    try {
      const customers = await this.customersService.findAll();
      return res.status(HttpStatus.OK).json(customers);
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('register')
  async registerCustomer(@Body() body: any, @Res() res: Response) {
    try {
      const customer = await this.customersService.register(body);
      // Clean up password from response
      const customerObj = customer.toObject();
      delete customerObj.password;

      return res
        .status(HttpStatus.OK)
        .json({ success: true, customer: customerObj });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  @Post('send-signup-otp')
  async sendSignupOtp(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.customersService.sendSignupOtp(body);
      return res.status(HttpStatus.OK).json(result);
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  @Post('verify-signup-otp')
  async verifySignupOtp(
    @Body() body: { email: string; otp: string },
    @Res() res: Response,
  ) {
    try {
      const customer = await this.customersService.verifySignupOtp(
        body.email,
        body.otp,
      );
      const customerObj = customer.toObject();
      delete customerObj.password;
      return res
        .status(HttpStatus.OK)
        .json({ success: true, customer: customerObj });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: err.message });
    }
  }

  @Get('addresses')
  async getAddresses(
    @Query('email') emailQuery: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const email = emailQuery || body?.email;
      if (!email) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: 'Email parameter is required' });
      }
      const addresses = await this.customersService.getAddresses(email);
      return res.status(HttpStatus.OK).json({ success: true, addresses });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('addresses')
  async addAddress(
    @Body() body: { email: string; address: any },
    @Res() res: Response,
  ) {
    try {
      const addresses = await this.customersService.addAddress(
        body.email,
        body.address,
      );
      return res.status(HttpStatus.OK).json({ success: true, addresses });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('addresses/update')
  async updateAddress(
    @Body() body: { email: string; addressId: string; updatedFields: any },
    @Res() res: Response,
  ) {
    try {
      const addresses = await this.customersService.updateAddress(
        body.email,
        body.addressId,
        body.updatedFields,
      );
      return res.status(HttpStatus.OK).json({ success: true, addresses });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('addresses/delete')
  async deleteAddress(
    @Body() body: { email: string; addressId: string },
    @Res() res: Response,
  ) {
    try {
      const addresses = await this.customersService.deleteAddress(
        body.email,
        body.addressId,
      );
      return res.status(HttpStatus.OK).json({ success: true, addresses });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('profile/update')
  async updateProfile(
    @Body()
    body: { email: string; name?: string; phone?: string; city?: string },
    @Res() res: Response,
  ) {
    try {
      if (!body.email) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: 'Email is required' });
      }
      const customer = await this.customersService.updateProfile(
        body.email,
        body,
      );

      const customerObj = customer.toObject();
      delete customerObj.password;

      return res
        .status(HttpStatus.OK)
        .json({ success: true, customer: customerObj });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }
}
