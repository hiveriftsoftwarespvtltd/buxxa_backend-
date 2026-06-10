import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Category } from '../../schemas/category.schema';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async onModuleInit() {
    // Check if new category structure exists. If not, clear and re-seed.
    try {
      const hasNewCategory = await this.categoryModel.findOne({ slug: 'gym-sports' }).exec();
      const hasOldCategory = await this.categoryModel.findOne({ slug: 'travel-collection' }).exec();
      if (!hasNewCategory || hasOldCategory) {
        console.log('🧹 Aligning categories in MongoDB to the new BUXXA bags taxonomy...');
        await this.categoryModel.deleteMany({}).exec();
      }
    } catch (err) {
      console.error('Error checking/clearing old categories:', err);
    }

    // 2. Seed default categories from categories.json if empty
    try {
      const count = await this.categoryModel.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding default BUXXA categories into MongoDB from categories.json...');
        const jsonPath = path.join(process.cwd(), 'src', 'categories.json');
        if (fs.existsSync(jsonPath)) {
          const rawData = fs.readFileSync(jsonPath, 'utf8');
          const defaultCategories = JSON.parse(rawData);
          await this.categoryModel.insertMany(defaultCategories);
          console.log(`✅ Seeded ${defaultCategories.length} default categories successfully.`);
        } else {
          console.error(`⚠️ Seed file not found at: ${jsonPath}`);
        }
      }
    } catch (err) {
      console.error('Error seeding categories:', err);
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async add(payload: any): Promise<Category> {
    const categories = await this.findAll();
    const newId = categories.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;
    const slug = (payload.name || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newCategory = new this.categoryModel({
      ...payload,
      id: newId,
      slug,
      enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : true,
      count: payload.count !== undefined ? parseInt(payload.count) : 0,
    });

    return newCategory.save();
  }

  async update(id: number, payload: any): Promise<Category | null> {
    const updateData: any = { ...payload };
    if (payload.name) {
      updateData.slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (payload.enabled !== undefined) {
      updateData.enabled = Boolean(payload.enabled);
    }
    if (payload.count !== undefined) {
      updateData.count = parseInt(payload.count) || 0;
    }
    return this.categoryModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).exec();
  }

  async delete(id: number): Promise<Category | null> {
    return this.categoryModel.findOneAndDelete({ id }).exec();
  }
}
