import { query } from '../services/database';
import { QueryBuilder } from '../services/queryBuilder';
import { normalizeString } from '../utils/stringUtils';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export class CategoryModel {
  static async findAll(): Promise<CategoryWithSubcategories[]> {
    const sql = `
      SELECT 
        c.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN s.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', s.id,
                  'name', s.name,
                  'slug', s.slug,
                  'category_id', s.category_id,
                  'created_at', s.created_at,
                  'updated_at', s.updated_at
                )
              ELSE NULL 
            END
            ORDER BY s.name ASC
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'::json
        ) as subcategories
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      GROUP BY c.id, c.name, c.slug, c.created_at, c.updated_at
      ORDER BY c.name ASC
    `;

    const result = await query(sql);
    return result.rows;
  }

  static async findById(id: string): Promise<CategoryWithSubcategories | null> {
    const sql = `
      SELECT 
        c.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN s.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', s.id,
                  'name', s.name,
                  'slug', s.slug,
                  'category_id', s.category_id,
                  'created_at', s.created_at,
                  'updated_at', s.updated_at
                )
              ELSE NULL 
            END
            ORDER BY s.name ASC
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'::json
        ) as subcategories
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.slug, c.created_at, c.updated_at
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name: string): Promise<CategoryWithSubcategories | null> {
    const normalizedName = normalizeString(name);
    
    const sql = `
      SELECT 
        c.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN s.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', s.id,
                  'name', s.name,
                  'slug', s.slug,
                  'category_id', s.category_id,
                  'created_at', s.created_at,
                  'updated_at', s.updated_at
                )
              ELSE NULL 
            END
            ORDER BY s.name ASC
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'::json
        ) as subcategories
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      WHERE c.slug = $1 
         OR c.slug = $2
         OR LOWER(TRANSLATE(c.name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $2
      GROUP BY c.id, c.name, c.slug, c.created_at, c.updated_at
    `;

    const result = await query(sql, [name, normalizedName]);
    return result.rows[0] || null;
  }

  static async findSubcategories(categoryId: string): Promise<Subcategory[]> {
    const { query: sql, params } = QueryBuilder
      .select('subcategories')
      .where('category_id', categoryId)
      .orderBy('name', 'ASC')
      .build();

    const result = await query(sql, params);
    return result.rows;
  }

  static async findSubcategoriesByName(categoryName: string): Promise<Subcategory[]> {
    const normalizedName = normalizeString(categoryName);
    
    const sql = `
      SELECT s.* FROM subcategories s
      INNER JOIN categories c ON s.category_id = c.id
      WHERE c.slug = $1 
         OR c.slug = $2
         OR LOWER(TRANSLATE(c.name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $2
      ORDER BY s.name ASC
    `;

    const result = await query(sql, [categoryName, normalizedName]);
    return result.rows;
  }

  static async categoryExists(id: string): Promise<boolean> {
    const { query: sql, params } = QueryBuilder
      .select('categories', ['id'])
      .where('id', id)
      .limit(1)
      .build();

    const result = await query(sql, params);
    return result.rows.length > 0;
  }

  static async categoryExistsByName(name: string): Promise<boolean> {
    const normalizedName = normalizeString(name);
    
    const sql = `
      SELECT id FROM categories 
      WHERE slug = $1 
         OR slug = $2
         OR LOWER(TRANSLATE(name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = $2
      LIMIT 1
    `;

    const result = await query(sql, [name, normalizedName]);
    return result.rows.length > 0;
  }
}

export default CategoryModel;