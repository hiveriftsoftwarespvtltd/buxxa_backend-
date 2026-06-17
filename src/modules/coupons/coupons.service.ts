import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { RedeemedCoupon } from '../../schemas/redeemed-coupon.schema';
import { Coupon } from '../../schemas/coupon.schema';

@Injectable()
export class CouponsService implements OnModuleInit {
  private couponCodesSet: Set<string> = new Set();

  constructor(
    @InjectModel(RedeemedCoupon.name)
    private readonly redeemedCouponModel: Model<RedeemedCoupon>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      let jsonPath = path.join(__dirname, 'coupons_list.json');
      if (!fs.existsSync(jsonPath)) {
        // Fallback for development if json is not copied to dist yet
        jsonPath = path.join(
          process.cwd(),
          'src',
          'modules',
          'coupons',
          'coupons_list.json',
        );
      }

      if (fs.existsSync(jsonPath)) {
        const fileContent = fs.readFileSync(jsonPath, 'utf8');
        const codesList: string[] = JSON.parse(fileContent);
        this.couponCodesSet = new Set(
          codesList.map((c) => c.trim().toUpperCase()),
        );
        console.log(
          `🎟️ CouponsService initialized with ${this.couponCodesSet.size} codes.`,
        );
      } else {
        console.warn(
          '⚠️ coupons_list.json file not found in coupons module folder or source folder.',
        );
      }
    } catch (err) {
      console.error('❌ Failed to load coupons_list.json:', err);
    }

    // Seed default system coupons if database is empty
    try {
      const count = await this.couponModel.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding default coupons into MongoDB...');
        const defaultCoupons = [
          {
            code: 'BUXAA10',
            type: 'percent',
            value: 10,
            desc: '10% off your order',
            minSubtotal: 0,
            isActive: true,
          },
          {
            code: 'WELCOME20',
            type: 'percent',
            value: 20,
            desc: '20% off for new customers',
            minSubtotal: 0,
            isActive: true,
          },
          {
            code: 'FLAT500',
            type: 'fixed',
            value: 500,
            desc: '₹500 off on orders above ₹3,000',
            minSubtotal: 3000,
            isActive: true,
          },
        ];
        await this.couponModel.insertMany(defaultCoupons);
        console.log('✅ Seeded default coupons successfully.');
      }
    } catch (err) {
      console.error('Error seeding default coupons:', err);
    }
  }

  async validateAndRedeem(code: string, email?: string) {
    if (!email) {
      return {
        success: false,
        message: 'Please log in to redeem this premium coupon code.',
      };
    }

    const normalizedCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if the code is part of the 700 Level Up codes list
    if (!this.couponCodesSet.has(normalizedCode)) {
      return {
        success: false,
        message: 'Invalid coupon code. Please check and try again.',
      };
    }

    // 2. Check if this coupon code has already been redeemed globally
    const existingByCode = await this.redeemedCouponModel.findOne({
      code: normalizedCode,
    });
    if (existingByCode) {
      return {
        success: false,
        message: 'This coupon code has already been redeemed.',
      };
    }

    // 3. Check if this email has already redeemed any Level Up coupon code
    const existingByEmail = await this.redeemedCouponModel.findOne({
      email: cleanEmail,
    });
    if (existingByEmail) {
      return {
        success: false,
        message:
          'You have already redeemed a Level Up coupon code on this account.',
      };
    }

    // 4. Save the redemption record in database
    try {
      await this.redeemedCouponModel.create({
        code: normalizedCode,
        email: cleanEmail,
      });
    } catch (dbErr) {
      console.error('❌ Database error saving coupon redemption:', dbErr);
      return {
        success: false,
        message: 'A system database error occurred. Please try again.',
      };
    }

    // 5. Send confirmation mail to user
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://buxaa.in';

    if (emailUser) {
      console.log(
        `✉️ Dispatching SMTP discount redemption email for coupon ${normalizedCode} to ${cleanEmail}...`,
      );

      const emailHtml = `
        <div style="font-family: 'Lato', sans-serif; background-color: #FFFDF7; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #E8DFC8;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C9A84C; padding-bottom: 20px;">
            <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; margin: 0; color: #1A1208; letter-spacing: 2px;">BUXXA</h1>
            <span style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #C9A84C; display: block; margin-top: 5px;">Exclusive Discount Redeemed</span>
          </div>
          
          <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #8B6914; margin-top: 0; font-weight: 500;">Congratulations!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4A3B1F;">
            You have successfully redeemed your exclusive Level Up discount coupon code. The details of your discount are:
          </p>
          
          <div style="background-color: #FAF6EE; padding: 20px; border-radius: 4px; border: 1px solid #E8DFC8; margin: 20px 0; font-size: 13px; line-height: 1.8;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #8A7A5A; width: 150px; font-weight: bold;">Coupon Code:</td>
                <td style="color: #1A1208; font-family: monospace; font-size: 14px; font-weight: bold;">${normalizedCode}</td>
              </tr>
              <tr>
                <td style="color: #8A7A5A; font-weight: bold;">Discount Value:</td>
                <td style="color: #27AE60; font-weight: bold;">₹200 OFF</td>
              </tr>
              <tr>
                <td style="color: #8A7A5A; font-weight: bold;">Applies To:</td>
                <td style="color: #1A1208;">All BUXXA Premium Products</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #4A3B1F;">
            Your discount has been successfully applied to your shopping cart. You can now proceed to checkout to complete your purchase with this discount.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/cart" style="background-color: #C9A84C; color: #FFFFFF; padding: 12px 25px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border-radius: 2px; display: inline-block;">Return to Cart</a>
          </div>
          
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #E8DFC8; padding-top: 20px; font-size: 11px; color: #8A7A5A;">
            <p style="margin: 0;">© 2026 BUXXA. All rights reserved. Developed by <a href="https://hiverift.com" style="color: #C9A84C; text-decoration: none;">hiverift.com</a></p>
          </div>
        </div>
      `;

      try {
        await this.mailerService.sendMail({
          to: cleanEmail,
          from: `BUXXA <${emailUser}>`,
          subject: `🎉 Coupon Code Redeemed Successfully — BUXXA`,
          html: emailHtml,
        });
        console.log(
          `✅ Discount coupon email dispatched successfully to ${cleanEmail}.`,
        );
        return {
          success: true,
          code: normalizedCode,
          type: 'fixed',
          value: 200,
          desc: '₹200 off your order (Level Up Discount)',
          message: 'Coupon redeemed successfully! Confirmation email sent.',
        };
      } catch (err) {
        console.error('❌ Failed to send coupon confirmation email:', err);
        return {
          success: true,
          code: normalizedCode,
          type: 'fixed',
          value: 200,
          desc: '₹200 off your order (Level Up Discount)',
          message:
            'Coupon is valid and applied (email notification skipped due to mailer error).',
        };
      }
    }

    return {
      success: true,
      code: normalizedCode,
      type: 'fixed',
      value: 200,
      desc: '₹200 off your order (Level Up Discount)',
      message: 'Coupon is valid and applied.',
    };
  }

  async findAll() {
    return this.couponModel.find().exec();
  }

  async create(data: any) {
    const codeUpper = data.code.trim().toUpperCase();
    const existing = await this.couponModel.findOne({ code: codeUpper }).exec();
    if (existing) {
      throw new Error(`Coupon code "${codeUpper}" already exists.`);
    }
    const coupon = new this.couponModel({
      ...data,
      code: codeUpper,
    });
    return coupon.save();
  }

  async delete(code: string) {
    return this.couponModel
      .findOneAndDelete({ code: code.toUpperCase() })
      .exec();
  }

  async update(originalCode: string, data: any) {
    const originalCodeUpper = originalCode.trim().toUpperCase();
    const coupon = await this.couponModel
      .findOne({ code: originalCodeUpper })
      .exec();
    if (!coupon) {
      throw new Error(`Coupon code "${originalCodeUpper}" not found.`);
    }

    if (data.code) {
      const newCodeUpper = data.code.trim().toUpperCase();
      if (newCodeUpper !== originalCodeUpper) {
        const existing = await this.couponModel
          .findOne({ code: newCodeUpper })
          .exec();
        if (existing) {
          throw new Error(`Coupon code "${newCodeUpper}" already exists.`);
        }
        coupon.code = newCodeUpper;
      }
    }

    if (data.type !== undefined) coupon.type = data.type;
    if (data.value !== undefined) coupon.value = data.value;
    if (data.minSubtotal !== undefined) coupon.minSubtotal = data.minSubtotal;
    if (data.desc !== undefined) coupon.desc = data.desc;
    if (data.isActive !== undefined) coupon.isActive = data.isActive;
    if (data.expiryDate !== undefined) {
      coupon.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }
    if (data.usageLimit !== undefined) {
      coupon.usageLimit =
        data.usageLimit !== null && data.usageLimit !== ''
          ? Number(data.usageLimit)
          : null;
    }
    if (data.maxDiscount !== undefined) {
      coupon.maxDiscount =
        data.maxDiscount !== null && data.maxDiscount !== ''
          ? Number(data.maxDiscount)
          : null;
    }
    if (data.usedCount !== undefined) {
      coupon.usedCount = Number(data.usedCount);
    }

    return coupon.save();
  }

  async incrementUsedCount(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    return this.couponModel
      .findOneAndUpdate(
        { code: normalizedCode },
        { $inc: { usedCount: 1 } },
        { new: true },
      )
      .exec();
  }

  async findByCode(code: string) {
    return this.couponModel.findOne({ code: code.toUpperCase() }).exec();
  }

  async validate(code: string, subtotal: number, email?: string) {
    const normalizedCode = code.trim().toUpperCase();

    // Check custom database coupons first
    const coupon = await this.couponModel
      .findOne({ code: normalizedCode })
      .exec();
    if (coupon) {
      if (!coupon.isActive) {
        return {
          success: false,
          message: `Coupon "${normalizedCode}" is inactive.`,
        };
      }

      if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
        return {
          success: false,
          message: `Coupon "${normalizedCode}" has expired.`,
        };
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return {
          success: false,
          message: `Coupon "${normalizedCode}" usage limit has been exceeded.`,
        };
      }

      if (subtotal < coupon.minSubtotal) {
        return {
          success: false,
          message: `Coupon "${normalizedCode}" requires a minimum cart subtotal of ₹${coupon.minSubtotal.toLocaleString('en-IN')}.`,
        };
      }

      return {
        success: true,
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minSubtotal: coupon.minSubtotal,
          maxDiscount: coupon.maxDiscount,
          desc:
            coupon.desc ||
            `${coupon.type === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`} off your order`,
        },
      };
    }

    // Check Level Up coupons
    if (this.couponCodesSet.has(normalizedCode)) {
      // Check if this coupon has already been redeemed
      const existingByCode = await this.redeemedCouponModel
        .findOne({ code: normalizedCode })
        .exec();
      if (existingByCode) {
        return {
          success: false,
          message: 'This coupon code has already been redeemed.',
        };
      }

      // If email is provided, check if the email has already redeemed any Level Up coupon
      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        const existingByEmail = await this.redeemedCouponModel
          .findOne({ email: cleanEmail })
          .exec();
        if (existingByEmail) {
          return {
            success: false,
            message:
              'You have already redeemed a Level Up coupon code on this account.',
          };
        }
      }

      return {
        success: true,
        coupon: {
          code: normalizedCode,
          type: 'fixed',
          value: 200,
          minSubtotal: 0,
          maxDiscount: null,
          desc: '₹200 off your order (Level Up Discount)',
        },
      };
    }

    return {
      success: false,
      message: 'Invalid coupon code.',
    };
  }
}
