import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: ['fixed', 'percent'], default: 'fixed' })
  type: string;

  @Prop({ required: true })
  value: number;

  @Prop({ default: 0 })
  minSubtotal: number;

  @Prop({ default: '' })
  desc: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
