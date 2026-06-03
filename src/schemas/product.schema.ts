import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Note {
  @Prop({ type: [String], default: [] })
  top: string[];

  @Prop({ type: [String], default: [] })
  heart: string[];

  @Prop({ type: [String], default: [] })
  base: string[];
}

@Schema({ _id: false })
export class Variant {
  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ required: true })
  sku: string;
}

@Schema({ _id: false })
export class Seo {
  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ default: '' })
  slug: string;

  @Prop({ default: '' })
  ogImage: string;
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'KIORA' })
  brand: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: '' })
  subtitle: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ required: true })
  price: number;

  @Prop({ default: null })
  originalPrice: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ default: '' })
  selectedSize: string;

  @Prop({ type: [Variant], default: [] })
  variants: Variant[];

  @Prop({ type: Note, required: true })
  notes: Note;

  @Prop({ default: 'floral' })
  scentFamily: string;

  @Prop({ default: 'unisex' })
  gender: string;

  @Prop({ default: 'Eau de Parfum' })
  concentration: string;

  @Prop({ default: 5.0 })
  rating: number;

  @Prop({ default: 0 })
  reviews: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ default: true })
  isNewArrival: boolean;

  @Prop({ default: false })
  isBestseller: boolean;

  @Prop({ required: true })
  img: string;

  @Prop({ type: [String], default: [] })
  imgs: string[];

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Seo, required: true })
  seo: Seo;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
