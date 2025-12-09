import { db } from '../services/drizzle';
import { users } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
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
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)))
      .limit(1);
    return (rows[0] as any) || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);
    return (rows[0] as any) || null;
  }

  static async create(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const now = new Date();
    const rows = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone ?? null,
        role: (userData.role || 'CUSTOMER') as any,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0] as any;
  }

  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const updateData: any = { updatedAt: new Date() };
    if (userData.email) updateData.email = userData.email;
    if (userData.firstName) updateData.firstName = userData.firstName;
    if (userData.lastName) updateData.lastName = userData.lastName;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;

    const rows = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return (rows[0] as any) || null;
  }

  static async delete(id: string): Promise<boolean> {
    const rows = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return rows.length > 0;
  }

  static async list(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isActive, true)),
    ]);
    return { users: rows as any, total: Number(countRows[0]?.count ?? 0) };
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const rows = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return rows.length > 0;
  }
}

export default UserModel;