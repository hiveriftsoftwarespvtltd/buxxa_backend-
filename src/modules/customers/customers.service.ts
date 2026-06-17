import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from '../../schemas/customer.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CustomersService {
  // In-memory cache for signup OTPs
  private signupOtps = new Map<
    string,
    { otp: string; expiry: Date; payload: any }
  >();

  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async findAll(): Promise<Customer[]> {
    // Return all customers except their passwords for security
    return this.customerModel.find({}, { password: 0 }).exec();
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async sendSignupOtp(payload: any): Promise<any> {
    const email = payload.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('Email address already registered');
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // Expire in 10 minutes

    // Store in-memory
    this.signupOtps.set(email, { otp, expiry, payload });
    console.log(
      `[DEVELOPMENT ALERT] Generated signup OTP for ${email} is: ${otp}`,
    );

    const emailUser =
      this.configService.get<string>('EMAIL_USER') || 'concierge@buxxa.com';
    const emailHtml = `
      <div style="font-family: 'Lato', sans-serif; background-color: #FFFDF7; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #E8DFC8;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C9A84C; padding-bottom: 20px;">
          <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; margin: 0; color: #1A1208; letter-spacing: 2px;">BUXXA</h1>
          <span style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #C9A84C; display: block; margin-top: 5px;">Premium Bags & Luggage</span>
        </div>
        
        <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #8B6914; margin-top: 0; font-weight: 500;">Verify Your Email Address</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #4A3B1F;">
          Dear <strong>${payload.firstName || 'Customer'}</strong>,<br /><br />
          Thank you for starting your premium journey with BUXXA. Use the verification code below to verify your email and complete your registration:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1A1208; background-color: #FAF6EE; padding: 15px 30px; border: 1px solid #E8DFC8; border-radius: 4px;">${otp}</span>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #8A7A5A; text-align: center;">
          This code is valid for 10 minutes. If you did not initiate this registration request, please disregard this email.
        </p>
        
        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #E8DFC8; padding-top: 20px; font-size: 11px; color: #8A7A5A;">
          <p style="margin: 0;">© 2026 BUXXA. All rights reserved. Developed by <a href="https://hiverift.com" style="color: #C9A84C; text-decoration: none;">hiverift.com</a></p>
        </div>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to: email,
        from: `BUXAA <${emailUser}>`,
        replyTo: emailUser,
        subject: `Your BUXAA Verification Code: ${otp}`,
        text: `Hi ${payload.firstName || 'Customer'},\n\nYour BUXAA email verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, please ignore this email.\n\n© 2026 BUXAA`,
        html: emailHtml,
      });
      return { success: true, message: 'Verification OTP sent to your email.' };
    } catch (err) {
      console.error('Failed to send verification email:', err);
      console.log(
        `[DEVELOPMENT ALERT] SMTP send failed. Signup OTP for ${email} is: ${otp}`,
      );
      return {
        success: true,
        message: 'Verification OTP sent to your email.',
        tempPassDev: otp, // Development helper
      };
    }
  }

  async verifySignupOtp(email: string, otp: string): Promise<any> {
    const normEmail = email.toLowerCase();
    const cached = this.signupOtps.get(normEmail);

    if (!cached) {
      throw new Error('No active signup request found for this email address.');
    }

    if (new Date() > cached.expiry) {
      this.signupOtps.delete(normEmail);
      throw new Error(
        'Verification OTP has expired. Please try registering again.',
      );
    }

    if (cached.otp !== otp) {
      throw new Error('Invalid verification OTP. Please check your email.');
    }

    // OTP matches and is valid! Complete registration
    const customer = await this.register(cached.payload);

    // Remove from in-memory cache
    this.signupOtps.delete(normEmail);

    return customer;
  }

  async register(payload: any): Promise<Customer> {
    const email = payload.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('Email address already registered');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const fullName =
      `${payload.firstName || ''} ${payload.lastName || ''}`.trim() ||
      payload.name ||
      'Guest Customer';

    const newCustomer = new this.customerModel({
      name: fullName,
      email,
      phone: payload.phone || '',
      city: payload.city || 'Mumbai',
      joined: date,
      password: hashedPassword,
      role: 'customer',
    });

    return newCustomer.save();
  }

  async getAddresses(email: string): Promise<any[]> {
    const customer = await this.findByEmail(email);
    return customer?.addresses || [];
  }

  async addAddress(email: string, address: any): Promise<any[]> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    const addressId = `ADR-${Date.now()}`;
    const newAddress = {
      id: addressId,
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      phone: address.phone || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      isDefault: address.isDefault || false,
    };

    if (newAddress.isDefault) {
      // Set all other addresses of this customer to not default
      customer.addresses = (customer.addresses || []).map((addr: any) => ({
        ...addr,
        isDefault: false,
      }));
    } else if (!customer.addresses || customer.addresses.length === 0) {
      newAddress.isDefault = true; // force first address to default
    }

    customer.addresses = [...(customer.addresses || []), newAddress];
    await customer.save();
    return customer.addresses;
  }

  async updateAddress(
    email: string,
    addressId: string,
    updatedFields: any,
  ): Promise<any[]> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    if (updatedFields.isDefault) {
      customer.addresses = (customer.addresses || []).map((addr: any) => ({
        ...addr,
        isDefault: false,
      }));
    }

    customer.addresses = (customer.addresses || []).map((addr: any) => {
      if (addr.id === addressId) {
        return {
          ...addr,
          ...updatedFields,
          id: addressId, // protect ID
        };
      }
      return addr;
    });

    await customer.save();
    return customer.addresses;
  }

  async deleteAddress(email: string, addressId: string): Promise<any[]> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    const wasDefault = customer.addresses.find(
      (addr: any) => addr.id === addressId,
    )?.isDefault;
    customer.addresses = customer.addresses.filter(
      (addr: any) => addr.id !== addressId,
    );

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true; // set first remaining address as default
    }

    await customer.save();
    return customer.addresses;
  }

  async updateProfile(
    email: string,
    updatedFields: { name?: string; phone?: string; city?: string },
  ): Promise<Customer> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    if (updatedFields.name !== undefined) {
      customer.name = updatedFields.name;
    }
    if (updatedFields.phone !== undefined) {
      customer.phone = updatedFields.phone;
    }
    if (updatedFields.city !== undefined) {
      customer.city = updatedFields.city;
    }

    return customer.save();
  }
}
