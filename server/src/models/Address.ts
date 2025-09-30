import { query } from '../services/database';
import { QueryBuilder } from '../services/queryBuilder';

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
    const { query: sql, params } = QueryBuilder
      .select('addresses')
      .where('user_id', userId)
      .where('is_deleted = false')
      .orderBy('is_default', 'DESC')
      .build();

    // Add secondary sort by created_at
    const finalSql = sql.replace('ORDER BY is_default DESC', 'ORDER BY is_default DESC, created_at DESC');

    const result = await query(finalSql, params);
    return result.rows;
  }

  static async findById(id: string, userId: string): Promise<Address | null> {
    const { query: sql, params } = QueryBuilder
      .select('addresses')
      .where('id', id)
      .where('user_id', userId)
      .where('is_deleted = false')
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async create(addressData: CreateAddressData): Promise<Address> {
    const { query: sql, params } = QueryBuilder
      .insert('addresses')
      .values({
        id: crypto.randomUUID(),
        user_id: addressData.userId,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zipCode,
        country: addressData.country || 'Colombia',
        is_default: addressData.isDefault || false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async update(id: string, userId: string, addressData: UpdateAddressData): Promise<Address | null> {
    const updateData: any = {
      updated_at: new Date()
    };

    if (addressData.street) updateData.street = addressData.street;
    if (addressData.city) updateData.city = addressData.city;
    if (addressData.state) updateData.state = addressData.state;
    if (addressData.zipCode) updateData.zip_code = addressData.zipCode;
    if (addressData.country) updateData.country = addressData.country;
    if (addressData.isDefault !== undefined) updateData.is_default = addressData.isDefault;

    const { query: sql, params } = QueryBuilder
      .update('addresses')
      .set(updateData)
      .where('id', id)
      .where('user_id', userId)
      .where('is_deleted = false')
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .update('addresses')
      .set({
        is_deleted: true,
        updated_at: new Date()
      })
      .where('id', id)
      .where('user_id', userId)
      .build();

    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  static async clearDefaultFlag(userId: string): Promise<void> {
    const { query: sql, params } = QueryBuilder
      .update('addresses')
      .set({
        is_default: false,
        updated_at: new Date()
      })
      .where('user_id', userId)
      .where('is_deleted = false')
      .build();

    await query(sql, params);
  }

  static async setAsDefault(id: string, userId: string): Promise<boolean> {
    // First clear all default flags for this user
    await this.clearDefaultFlag(userId);

    // Then set this address as default
    const { query: sql, params } = QueryBuilder
      .update('addresses')
      .set({
        is_default: true,
        updated_at: new Date()
      })
      .where('id', id)
      .where('user_id', userId)
      .where('is_deleted = false')
      .build();

    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  static async exists(id: string, userId: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .select('addresses', ['id'])
      .where('id', id)
      .where('user_id', userId)
      .where('is_deleted = false')
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows.length > 0;
  }
}

export default AddressModel;