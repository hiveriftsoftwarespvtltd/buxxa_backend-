import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../../schemas/product.schema';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async onModuleInit() {
    // 1. Check if old perfume database seed exists and clear it to allow fresh bags seed
    try {
      const hasPerfume = await this.productModel.findOne({ slug: 'rose-mystique' }).exec();
      const hasOldCategory = await this.productModel.findOne({ category: { $in: ['men', 'women', 'unisex', 'signature', 'gift-sets'] } }).exec();
      if (hasPerfume || hasOldCategory) {
        console.log('🧹 Detected old perfume data in Products collection. Clearing for bag store seed...');
        await this.productModel.deleteMany({}).exec();
      }
    } catch (err) {
      console.error('Error checking/clearing old products:', err);
    }

    // 2. Migrate existing products to set isNewArrival to match isNew (or fallback to true)
    try {
      const updateResult = await this.productModel.updateMany(
        { isNewArrival: { $exists: false } },
        { $set: { isNewArrival: true } }
      ).exec();
      if (updateResult.modifiedCount > 0) {
        console.log(`🧹 Migrated ${updateResult.modifiedCount} products to use isNewArrival schema field.`);
      }
    } catch (migrationErr) {
      console.error('Migration isNew -> isNewArrival error:', migrationErr);
    }

    // 3. Seed default products from products.json if empty
    try {
      const count = await this.productModel.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding default BUXXA products into MongoDB from products.json...');
        const jsonPath = path.join(process.cwd(), 'src', 'products.json');
        if (fs.existsSync(jsonPath)) {
          const rawData = fs.readFileSync(jsonPath, 'utf8');
          const defaultProducts = JSON.parse(rawData);
          await this.productModel.insertMany(defaultProducts);
          console.log(`✅ Seeded ${defaultProducts.length} default products successfully.`);
        } else {
          console.error(`⚠️ Seed file not found at: ${jsonPath}`);
        }
      }
    } catch (err) {
      console.error('Error seeding products:', err);
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.productModel.findOne({ slug }).exec();
  }

  async add(payload: any): Promise<Product> {
    const products = await this.findAll();
    const newId = products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
    const slug = (payload.name || 'new-fragrance')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const price = parseInt(payload.price) || 2999;
    const originalPrice = payload.originalPrice ? parseInt(payload.originalPrice) : null;
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    let notes = payload.notes || { top: ['Fresh Notes'], heart: ['Floral Notes'], base: ['Amber Notes'] };
    if (notes && !Array.isArray(notes.top)) {
      notes = {
        top: typeof notes.top === 'string' ? notes.top.split(',').map((s: string) => s.trim()) : ['Fresh Notes'],
        heart: typeof notes.heart === 'string' ? notes.heart.split(',').map((s: string) => s.trim()) : ['Floral Notes'],
        base: typeof notes.base === 'string' ? notes.base.split(',').map((s: string) => s.trim()) : ['Amber Notes'],
      };
    }

    const sizeList = payload.sizes || ['50ml', '100ml'];
    const variants = Array.isArray(payload.variants) && payload.variants.length > 0
      ? payload.variants
      : sizeList.map((size: string) => ({
          size,
          price,
          stock: Math.floor((parseInt(payload.stock) || 50) / sizeList.length),
          sku: `KOR-${String(newId).padStart(4, '0')}-${size.replace('ml', '')}`
        }));

    const newProduct = new this.productModel({
      ...payload,
      id: newId,
      sku: payload.sku || `KOR-${String(newId).padStart(4, '0')}`,
      slug,
      price,
      originalPrice,
      discount,
      sizes: sizeList,
      selectedSize: sizeList[0],
      variants,
      notes,
      rating: 5.0,
      reviews: 0,
      stock: parseInt(payload.stock) || 50,
      isNewArrival: true,
      seo: payload.seo || {
        title: `${payload.name || 'New Fragrance'} | KIORA`,
        description: payload.subtitle || 'Premium KIORA fragrance',
        keywords: [slug, 'KIORA', 'perfume'],
        slug,
        ogImage: payload.img || 'images/prod-rose.webp'
      }
    });

    return newProduct.save();
  }

  async update(id: number, payload: any): Promise<Product | null> {
    console.log('--- PRODUCTS SERVICE UPDATE START ---');
    console.log('Update Product ID:', id);
    console.log('Incoming payload:', JSON.stringify(payload, null, 2));

    const updateData: any = { ...payload };

    if (payload.price !== undefined) {
      updateData.price = parseInt(payload.price);
    }
    if (payload.originalPrice !== undefined) {
      updateData.originalPrice = payload.originalPrice ? parseInt(payload.originalPrice) : null;
    }
    if (payload.stock !== undefined) {
      updateData.stock = parseInt(payload.stock);
    }

    // Calculate discount if price or originalPrice changes
    if (payload.price !== undefined || payload.originalPrice !== undefined) {
      const currentDoc = await this.productModel.findOne({ id }).exec();
      const updatedPrice = payload.price !== undefined ? parseInt(payload.price) : (currentDoc ? currentDoc.price : 0);
      const updatedOriginalPrice = payload.originalPrice !== undefined 
        ? (payload.originalPrice ? parseInt(payload.originalPrice) : null) 
        : (currentDoc ? currentDoc.originalPrice : null);
      
      if (updatedOriginalPrice && updatedPrice) {
        updateData.discount = Math.round(((updatedOriginalPrice - updatedPrice) / updatedOriginalPrice) * 100);
      } else {
        updateData.discount = 0;
      }
    }

    if (payload.notes !== undefined) {
      let notes = payload.notes;
      if (notes && !Array.isArray(notes.top)) {
        notes = {
          top: typeof notes.top === 'string' ? notes.top.split(',').map((s: string) => s.trim()) : notes.top,
          heart: typeof notes.heart === 'string' ? notes.heart.split(',').map((s: string) => s.trim()) : notes.heart,
          base: typeof notes.base === 'string' ? notes.base.split(',').map((s: string) => s.trim()) : notes.base,
        };
      }
      updateData.notes = notes;
    }

    console.log('Final updateData object to be sent to Mongo:', JSON.stringify(updateData, null, 2));

    const updatedDoc = await this.productModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).exec();
    console.log('Returned document from DB after update:', updatedDoc ? JSON.stringify({
      id: updatedDoc.id,
      name: updatedDoc.name,
      isBestseller: updatedDoc.isBestseller,
      isNewArrival: updatedDoc.isNewArrival,
      isFeatured: updatedDoc.isFeatured
    }, null, 2) : 'null');
    console.log('--- PRODUCTS SERVICE UPDATE END ---');

    return updatedDoc;
  }

  async delete(id: number): Promise<any> {
    return this.productModel.findOneAndDelete({ id }).exec();
  }
}
