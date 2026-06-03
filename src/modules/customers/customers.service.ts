import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from '../../schemas/customer.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    // Return all customers except their passwords for security
    return this.customerModel.find({}, { password: 0 }).exec();
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async register(payload: any): Promise<Customer> {
    const email = payload.email.toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('Email address already registered');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const fullName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.name || 'Guest Customer';

    const newCustomer = new this.customerModel({
      name: fullName,
      email,
      phone: payload.phone || '',
      city: payload.city || 'Mumbai',
      joined: date,
      password: hashedPassword,
      role: 'customer',
    });

    return newCustomer.save();
  }

  async getAddresses(email: string): Promise<any[]> {
    const customer = await this.findByEmail(email);
    return customer?.addresses || [];
  }

  async addAddress(email: string, address: any): Promise<any[]> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    const addressId = `ADR-${Date.now()}`;
    const newAddress = {
      id: addressId,
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      phone: address.phone || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      isDefault: address.isDefault || false,
    };

    if (newAddress.isDefault) {
      // Set all other addresses of this customer to not default
      customer.addresses = (customer.addresses || []).map((addr: any) => ({
        ...addr,
        isDefault: false,
      }));
    } else if (!customer.addresses || customer.addresses.length === 0) {
      newAddress.isDefault = true; // force first address to default
    }

    customer.addresses = [...(customer.addresses || []), newAddress];
    await customer.save();
    return customer.addresses;
  }

  async updateAddress(email: string, addressId: string, updatedFields: any): Promise<any[]> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    if (updatedFields.isDefault) {
      customer.addresses = (customer.addresses || []).map((addr: any) => ({
        ...addr,
        isDefault: false,
      }));
    }

    customer.addresses = (customer.addresses || []).map((addr: any) => {
      if (addr.id === addressId) {
        return {
          ...addr,
          ...updatedFields,
          id: addressId, // protect ID
        };
      }
      return addr;
    });

    await customer.save();
    return customer.addresses;
  }

  async deleteAddress(email: string, addressId: string): Promise<any[]> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    const wasDefault = customer.addresses.find((addr: any) => addr.id === addressId)?.isDefault;
    customer.addresses = customer.addresses.filter((addr: any) => addr.id !== addressId);

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true; // set first remaining address as default
    }

    await customer.save();
    return customer.addresses;
  }

  async updateProfile(email: string, updatedFields: { name?: string; phone?: string; city?: string }): Promise<Customer> {
    const customer = await this.findByEmail(email);
    if (!customer) throw new Error('Customer not found');

    if (updatedFields.name !== undefined) {
      customer.name = updatedFields.name;
    }
    if (updatedFields.phone !== undefined) {
      customer.phone = updatedFields.phone;
    }
    if (updatedFields.city !== undefined) {
      customer.city = updatedFields.city;
    }

    return customer.save();
  }
}
