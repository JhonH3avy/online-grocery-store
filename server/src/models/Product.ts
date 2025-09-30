import { query } from '../services/database';
import { QueryBuilder } from '../services/queryBuilder';
import { normalizeString } from '../utils/stringUtils';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  image_url?: string;
  category_id: string;
  subcategory_id: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  unit: string;
  imageUrl?: string;
  categoryId: string;
  subcategoryId: string;
  isFeatured?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  imageUrl?: string;
  categoryId?: string;
  subcategoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryId?: string;
  categoryName?: string;    // Support filtering by category name (slug)
  subcategoryName?: string; // Support filtering by subcategory name (slug)
  featured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class ProductModel {
  static async findById(id: string): Promise<Product | null> {
    const { query: sql, params } = QueryBuilder
      .select('products')
      .where('id', id)
      .where('is_active = true')
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async create(productData: CreateProductData): Promise<Product> {
    const { query: sql, params } = QueryBuilder
      .insert('products')
      .values({
        id: crypto.randomUUID(),
        name: productData.name,
        description: productData.description,
        price: productData.price,
        unit: productData.unit,
        image_url: productData.imageUrl,
        category_id: productData.categoryId,
        subcategory_id: productData.subcategoryId,
        is_active: true,
        is_featured: productData.isFeatured || false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async update(id: string, productData: UpdateProductData): Promise<Product | null> {
    const updateData: any = {
      updated_at: new Date()
    };

    if (productData.name) updateData.name = productData.name;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price) updateData.price = productData.price;
    if (productData.unit) updateData.unit = productData.unit;
    if (productData.imageUrl !== undefined) updateData.image_url = productData.imageUrl;
    if (productData.categoryId) updateData.category_id = productData.categoryId;
    if (productData.subcategoryId) updateData.subcategory_id = productData.subcategoryId;
    if (productData.isActive !== undefined) updateData.is_active = productData.isActive;
    if (productData.isFeatured !== undefined) updateData.is_featured = productData.isFeatured;

    const { query: sql, params } = QueryBuilder
      .update('products')
      .set(updateData)
      .where('id', id)
      .returning(['*'])
      .build();

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async list(options: ProductSearchOptions = {}): Promise<{ products: Product[], total: number }> {
    const { page = 1, limit = 10, categoryId, subcategoryId, categoryName, subcategoryName, featured, search, minPrice, maxPrice } = options;
    const offset = (page - 1) * limit;

    // Build FROM clause with JOINs if we need to filter by names
    let fromClause = 'products p';
    let whereClause = 'p.is_active = true';
    const whereParams: any[] = [];

    // Join with categories table if filtering by category name
    if (categoryName) {
      fromClause += ' INNER JOIN categories c ON p.category_id = c.id';
      const normalizedCategoryName = normalizeString(categoryName);
      whereParams.push(categoryName, normalizedCategoryName);
      whereClause += ` AND (c.slug = $${whereParams.length - 1} OR c.slug = $${whereParams.length} OR LOWER(TRANSLATE(c.name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $${whereParams.length})`;
    }

    // Join with subcategories table if filtering by subcategory name
    if (subcategoryName) {
      fromClause += ' INNER JOIN subcategories sc ON p.subcategory_id = sc.id';
      const normalizedSubcategoryName = normalizeString(subcategoryName);
      whereParams.push(subcategoryName, normalizedSubcategoryName);
      whereClause += ` AND (sc.slug = $${whereParams.length - 1} OR sc.slug = $${whereParams.length} OR LOWER(TRANSLATE(sc.name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $${whereParams.length})`;
    }

    // Support legacy filtering by IDs
    if (categoryId) {
      whereParams.push(categoryId);
      whereClause += ` AND p.category_id = $${whereParams.length}`;
    }

    if (subcategoryId) {
      whereParams.push(subcategoryId);
      whereClause += ` AND p.subcategory_id = $${whereParams.length}`;
    }

    if (featured !== undefined) {
      whereParams.push(featured);
      whereClause += ` AND p.is_featured = $${whereParams.length}`;
    }

    if (search) {
      whereParams.push(`%${search}%`);
      whereClause += ` AND (p.name ILIKE $${whereParams.length} OR p.description ILIKE $${whereParams.length})`;
    }

    if (minPrice !== undefined) {
      whereParams.push(minPrice);
      whereClause += ` AND p.price >= $${whereParams.length}`;
    }

    if (maxPrice !== undefined) {
      whereParams.push(maxPrice);
      whereClause += ` AND p.price <= $${whereParams.length}`;
    }

    // Get products
    whereParams.push(limit, offset);
    const productsSql = `
      SELECT p.* FROM ${fromClause}
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${whereParams.length - 1} OFFSET $${whereParams.length}
    `;

    // Get total count
    const countSql = `SELECT COUNT(p.*) as total FROM ${fromClause} WHERE ${whereClause}`;
    const countParams = whereParams.slice(0, -2); // Remove limit and offset

    const [productsResult, countResult] = await Promise.all([
      query(productsSql, whereParams),
      query(countSql, countParams)
    ]);

    return {
      products: productsResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async getFeatured(limit: number = 8): Promise<Product[]> {
    const { query: sql, params } = QueryBuilder
      .select('products')
      .where('is_active = true')
      .where('is_featured = true')
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .build();

    const result = await query(sql, params);
    return result.rows;
  }

  static async getByCategory(categoryId: string, limit: number = 20): Promise<Product[]> {
    const { query: sql, params } = QueryBuilder
      .select('products')
      .where('is_active = true')
      .where('category_id', categoryId)
      .orderBy('name', 'ASC')
      .limit(limit)
      .build();

    const result = await query(sql, params);
    return result.rows;
  }

  static async getByCategoryName(categoryName: string, limit: number = 20): Promise<Product[]> {
    const normalizedName = normalizeString(categoryName);
    
    const sql = `
      SELECT p.* FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true 
        AND (c.slug = $1 
             OR c.slug = $3
             OR LOWER(TRANSLATE(c.name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $3)
      ORDER BY p.name ASC
      LIMIT $2
    `;

    const result = await query(sql, [categoryName, limit, normalizedName]);
    return result.rows;
  }

  static async getBySubcategoryName(subcategoryName: string, limit: number = 20): Promise<Product[]> {
    const normalizedName = normalizeString(subcategoryName);
    
    const sql = `
      SELECT p.* FROM products p
      INNER JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_active = true 
        AND (sc.slug = $1 
             OR sc.slug = $3
             OR LOWER(TRANSLATE(sc.name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $3)
      ORDER BY p.name ASC
      LIMIT $2
    `;

    const result = await query(sql, [subcategoryName, limit, normalizedName]);
    return result.rows;
  }

  static async delete(id: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .update('products')
      .set({ is_active: false, updated_at: new Date() })
      .where('id', id)
      .build();

    const result = await query(sql, params);
    return result.rowCount > 0;
  }
}

export default ProductModel;