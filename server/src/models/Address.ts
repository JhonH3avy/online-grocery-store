import { db } from '../services/drizzle';
import { addresses } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAddressData {
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
}

export class AddressModel {
  static async findByUserId(userId: string): Promise<Address[]> {
    const rows = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.userId, userId), eq(addresses.isDeleted as any, false)))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
    return rows as any;
  }

  static async findById(id: string, userId: string): Promise<Address | null> {
    const rows = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId), eq(addresses.isDeleted as any, false)))
      .limit(1);
    return (rows[0] as any) || null;
  }

  static async create(addressData: CreateAddressData): Promise<Address> {
    const now = new Date();
    const rows = await db
      .insert(addresses)
      .values({
        id: crypto.randomUUID(),
        userId: addressData.userId,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        country: addressData.country || 'Colombia',
        isDefault: addressData.isDefault || false,
        isDeleted: false as any,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0] as any;
  }

  static async update(id: string, userId: string, addressData: UpdateAddressData): Promise<Address | null> {
    const updateData: any = { updatedAt: new Date() };

    if (addressData.street) updateData.street = addressData.street;
    if (addressData.city) updateData.city = addressData.city;
    if (addressData.state) updateData.state = addressData.state;
    if (addressData.zipCode) updateData.zipCode = addressData.zipCode;
    if (addressData.country) updateData.country = addressData.country;
    if (addressData.isDefault !== undefined) updateData.isDefault = addressData.isDefault;

    const rows = await db
      .update(addresses)
      .set(updateData)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId), eq(addresses.isDeleted as any, false)))
      .returning();
    return (rows[0] as any) || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const rows = await db
      .update(addresses)
      .set({ isDeleted: true as any, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning({ id: addresses.id });
    return rows.length > 0;
  }

  static async clearDefaultFlag(userId: string): Promise<void> {
    await db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(addresses.userId, userId), eq(addresses.isDeleted as any, false)));
  }

  static async setAsDefault(id: string, userId: string): Promise<boolean> {
    // First clear all default flags for this user
    await this.clearDefaultFlag(userId);

    // Then set this address as default
    const rows = await db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId), eq(addresses.isDeleted as any, false)))
      .returning({ id: addresses.id });
    return rows.length > 0;
  }

  static async exists(id: string, userId: string): Promise<boolean> {
    const rows = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId), eq(addresses.isDeleted as any, false)))
      .limit(1);
    return rows.length > 0;
  }
}

export default AddressModel;