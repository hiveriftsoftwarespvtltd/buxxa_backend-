import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  joined: string;

  @Prop({ required: true })
  password?: string; // Hashed password

  @Prop({ default: 'customer' })
  role: string; // customer, admin

  @Prop({ type: [Object], default: [] })
  addresses: any[]; // shipping & billing addresses
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
