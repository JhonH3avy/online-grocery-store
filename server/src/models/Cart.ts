import { db } from '../services/drizzle';
import { cartItems, products } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CartItemWithProduct extends CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    image_url?: string;
    is_active: boolean;
  };
}

export class CartModel {
  static async findByUserId(userId: string): Promise<CartItemWithProduct[]> {
    const rows = await db
      .select({
        id: cartItems.id,
        user_id: cartItems.userId,
        product_id: cartItems.productId,
        quantity: cartItems.quantity,
        created_at: cartItems.createdAt,
        updated_at: cartItems.updatedAt,
        p_id: products.id,
        p_name: products.name,
        p_price: products.price,
        p_unit: products.unit,
        p_image_url: products.imageUrl,
        p_is_active: products.isActive,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
    return rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      product_id: r.product_id,
      quantity: r.quantity,
      created_at: r.created_at,
      updated_at: r.updated_at,
      product: {
        id: r.p_id,
        name: r.p_name,
        price: r.p_price,
        unit: r.p_unit,
        image_url: r.p_image_url,
        is_active: r.p_is_active,
      },
    })) as any;
  }

  static async findCartItem(userId: string, productId: string): Promise<CartItem | null> {
    const rows = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .limit(1);
    return (rows[0] as any) || null;
  }

  static async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const now = new Date();
    const rows = await db
      .insert(cartItems)
      .values({
        id: crypto.randomUUID(),
        userId: userId,
        productId: productId,
        quantity: quantity,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0] as any;
  }

  static async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem | null> {
    const rows = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .returning();
    return (rows[0] as any) || null;
  }

  static async removeItem(userId: string, productId: string): Promise<boolean> {
    const rows = await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .returning({ id: cartItems.id });
    return rows.length > 0;
  }

  static async clearCart(userId: string): Promise<boolean> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
    return true;
  }

  static async getCartSummary(userId: string): Promise<{
    items: CartItemWithProduct[];
    totalItems: number;
    subtotal: number;
  }> {
    const items = await this.findByUserId(userId);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    return {
      items,
      totalItems,
      subtotal: Math.round(subtotal * 100) / 100
    };
  }
}

export default CartModel;