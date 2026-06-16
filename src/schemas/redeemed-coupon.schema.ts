import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RedeemedCoupon extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true, index: true })
  email: string;
}

export const RedeemedCouponSchema = SchemaFactory.createForClass(RedeemedCoupon);
