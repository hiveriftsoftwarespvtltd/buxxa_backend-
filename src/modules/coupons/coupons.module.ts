import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import {
  RedeemedCoupon,
  RedeemedCouponSchema,
} from '../../schemas/redeemed-coupon.schema';
import { Coupon, CouponSchema } from '../../schemas/coupon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RedeemedCoupon.name, schema: RedeemedCouponSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
