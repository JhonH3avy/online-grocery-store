import { db } from '../services/drizzle';
import { categories, subcategories } from '../db/schema';
import { eq, sql, asc, and } from 'drizzle-orm';
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
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        created_at: categories.createdAt,
        updated_at: categories.updatedAt,
        subcategories: sql`COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ${subcategories.id}, 'name', ${subcategories.name}, 'slug', ${subcategories.slug}, 'category_id', ${subcategories.categoryId}, 'created_at', ${subcategories.createdAt}, 'updated_at', ${subcategories.updatedAt}) ORDER BY ${subcategories.name} ASC) FILTER (WHERE ${subcategories.id} IS NOT NULL), '[]'::json)`
      })
      .from(categories)
      .leftJoin(subcategories, eq(subcategories.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug, categories.createdAt, categories.updatedAt)
      .orderBy(asc(categories.name));
    return rows as any;
  }

  static async findById(id: string): Promise<CategoryWithSubcategories | null> {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        created_at: categories.createdAt,
        updated_at: categories.updatedAt,
        subcategories: sql`COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ${subcategories.id}, 'name', ${subcategories.name}, 'slug', ${subcategories.slug}, 'category_id', ${subcategories.categoryId}, 'created_at', ${subcategories.createdAt}, 'updated_at', ${subcategories.updatedAt}) ORDER BY ${subcategories.name} ASC) FILTER (WHERE ${subcategories.id} IS NOT NULL), '[]'::json)`
      })
      .from(categories)
      .leftJoin(subcategories, eq(subcategories.categoryId, categories.id))
      .where(eq(categories.id, id))
      .groupBy(categories.id, categories.name, categories.slug, categories.createdAt, categories.updatedAt);
    return (rows[0] as any) || null;
  }

  static async findByName(name: string): Promise<CategoryWithSubcategories | null> {
    const normalizedName = normalizeString(name);
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        created_at: categories.createdAt,
        updated_at: categories.updatedAt,
        subcategories: sql`COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', ${subcategories.id}, 'name', ${subcategories.name}, 'slug', ${subcategories.slug}, 'category_id', ${subcategories.categoryId}, 'created_at', ${subcategories.createdAt}, 'updated_at', ${subcategories.updatedAt}) ORDER BY ${subcategories.name} ASC) FILTER (WHERE ${subcategories.id} IS NOT NULL), '[]'::json)`
      })
      .from(categories)
      .leftJoin(subcategories, eq(subcategories.categoryId, categories.id))
      .where(sql`(${categories.slug} = ${name} OR ${categories.slug} = ${normalizedName} OR LOWER(TRANSLATE(${categories.name}, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = ${normalizedName})`)
      .groupBy(categories.id, categories.name, categories.slug, categories.createdAt, categories.updatedAt);
    return (rows[0] as any) || null;
  }

  static async findSubcategories(categoryId: string): Promise<Subcategory[]> {
    const rows = await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.categoryId, categoryId))
      .orderBy(asc(subcategories.name));
    return rows as any;
  }

  static async findSubcategoriesByName(categoryName: string): Promise<Subcategory[]> {
    const normalizedName = normalizeString(categoryName);
    const rows = await db
      .select({ s: subcategories })
      .from(subcategories)
      .innerJoin(categories, eq(subcategories.categoryId, categories.id))
      .where(sql`(${categories.slug} = ${categoryName} OR ${categories.slug} = ${normalizedName} OR LOWER(TRANSLATE(${categories.name}, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = ${normalizedName})`)
      .orderBy(asc(subcategories.name));
    return rows.map(r => r.s) as any;
  }

  static async categoryExists(id: string): Promise<boolean> {
    const rows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return rows.length > 0;
  }

  static async categoryExistsByName(name: string): Promise<boolean> {
    const normalizedName = normalizeString(name);
    const rows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(sql`(${categories.slug} = ${name} OR ${categories.slug} = ${normalizedName} OR LOWER(TRANSLATE(${categories.name}, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) = ${normalizedName})`)
      .limit(1);
    return rows.length > 0;
  }
}

export default CategoryModel;