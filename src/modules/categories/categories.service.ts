import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../schemas/category.schema';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.categoryModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default categories into MongoDB...');
      const defaultCategories = [
        { id: 1, name: "Women's Perfume", slug: 'women',     emoji: '🌸', img: 'images/prod-rose.png',   enabled: true, count: 24 },
        { id: 2, name: "Men's Perfume",   slug: 'men',       emoji: '🌊', img: 'images/prod-oud.png',    enabled: true, count: 18 },
        { id: 3, name: 'Unisex',          slug: 'unisex',    emoji: '✨', img: 'images/prod-noir.png',   enabled: true, count: 12 },
        { id: 4, name: 'Gift Sets',       slug: 'gift-sets', emoji: '🎁', img: 'images/hero3.png',       enabled: true, count: 8  },
        { id: 5, name: 'Oud & Oriental',  slug: 'oud',       emoji: '🌙', img: 'images/prod-velvet.png', enabled: true, count: 15 }
      ];
      await this.categoryModel.insertMany(defaultCategories);
      console.log('✅ Seeded default categories successfully.');
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
}
