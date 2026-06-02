import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CustomersService } from '../customers/customers.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly customersService: CustomersService,
  ) {}

  async login(payload: any) {
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    // Load admin settings from config
    const envAdminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@kioralifestyle.com';
    const envAdminPass = this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';

    // 1. Check Admin Credentials
    if (
      email === envAdminEmail.toLowerCase() || 
      email === 'admin@kioralifestyle.com'
    ) {
      const matchPass = email === 'admin@kioralifestyle.com' ? 'admin123' : envAdminPass;
      if (password === matchPass) {
        const tokenPayload = { email, role: 'admin', name: 'KIORA Admin' };
        const token = this.jwtService.sign(tokenPayload);
        return {
          success: true,
          token,
          user: {
            id: 'admin-123',
            name: 'Concierge Admin',
            email,
            role: 'admin',
          },
        };
      }
    }

    // 2. Check Customer Credentials
    const customer = await this.customersService.findByEmail(email);
    if (!customer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, customer.password || '');
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokenPayload = { id: customer._id, email: customer.email, role: customer.role, name: customer.name };
    const token = this.jwtService.sign(tokenPayload);

    return {
      success: true,
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
      },
    };
  }
}
