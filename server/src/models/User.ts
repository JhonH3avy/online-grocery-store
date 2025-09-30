import { query, transaction } from '../services/database';
import { QueryBuilder } from '../services/queryBuilder';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER';
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const { query: sql, params } = QueryBuilder
      .select('users')
      .where('id', id)
      .where('is_active = true')
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { query: sql, params } = QueryBuilder
      .select('users')
      .where('email', email)
      .where('is_active = true')
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async create(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const { query: sql, params } = QueryBuilder
      .insert('users')
      .values({
        id: crypto.randomUUID(),
        email: userData.email,
        password: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        role: userData.role || 'CUSTOMER',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const updateData: any = {
      updated_at: new Date()
    };

    if (userData.email) updateData.email = userData.email;
    if (userData.firstName) updateData.first_name = userData.firstName;
    if (userData.lastName) updateData.last_name = userData.lastName;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.isActive !== undefined) updateData.is_active = userData.isActive;

    const { query: sql, params } = QueryBuilder
      .update('users')
      .set(updateData)
      .where('id', id)
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .update('users')
      .set({ is_active: false, updated_at: new Date() })
      .where('id', id)
      .build();

    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  static async list(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;

    // Get users
    const { query: usersSql, params: usersParams } = QueryBuilder
      .select('users')
      .where('is_active = true')
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .build();

    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';

    const [usersResult, countResult] = await Promise.all([
      query(usersSql, usersParams),
      query(countSql)
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const { query: sql, params } = QueryBuilder
      .update('users')
      .set({ 
        password: hashedPassword,
        updated_at: new Date()
      })
      .where('id', id)
      .build();

    const result = await query(sql, params);
    return result.rowCount > 0;
  }
}

export default UserModel;