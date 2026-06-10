import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from '../../schemas/brand.schema';

@Injectable()
export class BrandsService implements OnModuleInit {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<Brand>,
  ) {}

  async onModuleInit() {
    try {
      const hasOnlyKiora = await this.brandModel.findOne({ name: 'KIORA' }).exec();
      const hasBuxxa = await this.brandModel.findOne({ name: 'BUXXA' }).exec();
      if (hasOnlyKiora && !hasBuxxa) {
        console.log('🧹 Detected old brand data. Clearing for bag store seed...');
        await this.brandModel.deleteMany({}).exec();
      }
    } catch (err) {
      console.error('Error clearing old brands:', err);
    }

    const count = await this.brandModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default brands into MongoDB...');
      const defaultBrands = [
        { id: 1, name: 'BUXXA', logo: '', tagline: 'Premium Bags & Luggage', enabled: true },
        { id: 2, name: 'KIORA', logo: '', tagline: 'The Art of Fragrance', enabled: true }
      ];
      await this.brandModel.insertMany(defaultBrands);
      console.log('✅ Seeded default brands successfully.');
    }
  }

  async findAll(): Promise<Brand[]> {
    return this.brandModel.find().exec();
  }

  async add(payload: any): Promise<Brand> {
    const brands = await this.findAll();
    const newId = brands.reduce((max, b) => b.id > max ? b.id : max, 0) + 1;

    const newBrand = new this.brandModel({
      ...payload,
      id: newId,
      enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : true,
    });

    return newBrand.save();
  }
}
