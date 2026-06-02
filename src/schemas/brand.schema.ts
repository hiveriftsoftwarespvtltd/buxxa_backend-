import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Brand extends Document {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: '' })
  logo: string;

  @Prop({ default: '' })
  tagline: string;

  @Prop({ default: true })
  enabled: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
