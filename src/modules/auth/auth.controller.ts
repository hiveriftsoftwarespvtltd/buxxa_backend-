import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.authService.login(body);
      return res.status(HttpStatus.OK).json(result);
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: err.message || 'Invalid email or password',
      });
    }
  }

  @Post('forgot-password/request-otp')
  async requestOtp(@Body() body: { email: string }, @Res() res: Response) {
    try {
      if (!body.email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Email parameter is required.' });
      }
      const result = await this.authService.requestPasswordResetOtp(body.email);
      return res.status(HttpStatus.OK).json(result);
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string; otp: string; newPassword?: string }, @Res() res: Response) {
    try {
      if (!body.email) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Email parameter is required.' });
      }
      if (!body.otp) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'OTP is required.' });
      }
      const result = await this.authService.forgotPassword(body.email, body.otp, body.newPassword);
      return res.status(HttpStatus.OK).json(result);
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message });
    }
  }
}
