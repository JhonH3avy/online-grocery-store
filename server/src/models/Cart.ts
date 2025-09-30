import { query } from '../services/database';
import { QueryBuilder } from '../services/queryBuilder';

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
    const sql = `
      SELECT 
        ci.*,
        JSON_BUILD_OBJECT(
          'id', p.id,
          'name', p.name,
          'price', p.price,
          'unit', p.unit,
          'image_url', p.image_url,
          'is_active', p.is_active
        ) as product
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND p.is_active = true
      ORDER BY ci.created_at DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  static async findCartItem(userId: string, productId: string): Promise<CartItem | null> {
    const { query: sql, params } = QueryBuilder
      .select('cart_items')
      .where('user_id', userId)
      .where('product_id', productId)
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const { query: sql, params } = QueryBuilder
      .insert('cart_items')
      .values({
        id: crypto.randomUUID(),
        user_id: userId,
        product_id: productId,
        quantity: quantity,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem | null> {
    const { query: sql, params } = QueryBuilder
      .update('cart_items')
      .set({
        quantity: quantity,
        updated_at: new Date()
      })
      .where('user_id', userId)
      .where('product_id', productId)
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async removeItem(userId: string, productId: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .delete('cart_items')
      .where('user_id', userId)
      .where('product_id', productId)
      .build();

    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  static async clearCart(userId: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .delete('cart_items')
      .where('user_id', userId)
      .build();

    const result = await query(sql, params);
    return result.rowCount >= 0; // Returns true even if cart was already empty
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