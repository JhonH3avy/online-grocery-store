const { query } = require('../dist/services/database');

/**
 * Database seeding script for the Online Grocery Store
 * This script populates the database with initial data including:
 * - Categories and subcategories
 * - Sample products
 * - Admin user
 */

const FORCE_RESEED = process.env.FORCE_RESEED === 'true';

async function clearExistingData() {
  if (!FORCE_RESEED) {
    console.log('ℹ️ Skipping data clearing (FORCE_RESEED not enabled)');
    return;
  }

  console.log('🗑️ Clearing existing data...');
  
  try {
    // Clear in reverse dependency order
    await query('DELETE FROM cart_items');
    await query('DELETE FROM order_items');
    await query('DELETE FROM orders');
    await query('DELETE FROM reviews');
    await query('DELETE FROM inventory');
    await query('DELETE FROM products');
    await query('DELETE FROM subcategories');
    await query('DELETE FROM categories');
    await query('DELETE FROM addresses');
    await query('DELETE FROM users WHERE email != $1', ['admin@grocery.com']); // Keep admin
    await query('DELETE FROM contact_submissions');
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function seedCategories() {
  console.log('📂 Seeding categories...');

  const categories = [
    { name: 'Frutas', slug: 'frutas' },
    { name: 'Vegetales', slug: 'vegetales' },
    { name: 'Lácteos', slug: 'lacteos' },
    { name: 'Bebidas', slug: 'bebidas' }
  ];

  const categoryIds = {};

  for (const category of categories) {
    // Check if category exists
    const existing = await query('SELECT id FROM categories WHERE slug = $1', [category.slug]);
    
    if (existing.rows.length > 0) {
      console.log(`⏭️  Category '${category.name}' already exists`);
      categoryIds[category.slug] = existing.rows[0].id;
    } else {
      const result = await query(`
        INSERT INTO categories (id, name, slug, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW())
        RETURNING id
      `, [category.name, category.slug]);
      
      categoryIds[category.slug] = result.rows[0].id;
      console.log(`✅ Created category: ${category.name}`);
    }
  }

  return categoryIds;
}

async function seedSubcategories(categoryIds) {
  console.log('📁 Seeding subcategories...');

  const subcategories = [
    // Frutas subcategories
    { name: 'Cítricos', slug: 'citricos', categorySlug: 'frutas' },
    { name: 'Tropicales', slug: 'tropicales', categorySlug: 'frutas' },
    
    // Vegetales subcategories
    { name: 'Verdes', slug: 'verdes', categorySlug: 'vegetales' },
    { name: 'Raíces', slug: 'raices', categorySlug: 'vegetales' },
    
    // Lácteos subcategories
    { name: 'Leche', slug: 'leche', categorySlug: 'lacteos' },
    { name: 'Quesos', slug: 'quesos', categorySlug: 'lacteos' },
    
    // Bebidas subcategories
    { name: 'Jugos', slug: 'jugos', categorySlug: 'bebidas' },
    { name: 'Agua', slug: 'agua', categorySlug: 'bebidas' }
  ];

  const subcategoryIds = {};

  for (const subcategory of subcategories) {
    const categoryId = categoryIds[subcategory.categorySlug];
    
    // Check if subcategory exists
    const existing = await query('SELECT id FROM subcategories WHERE slug = $1 AND category_id = $2', 
      [subcategory.slug, categoryId]);
    
    if (existing.rows.length > 0) {
      console.log(`⏭️  Subcategory '${subcategory.name}' already exists`);
      subcategoryIds[subcategory.slug] = existing.rows[0].id;
    } else {
      const result = await query(`
        INSERT INTO subcategories (id, name, slug, category_id, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [subcategory.name, subcategory.slug, categoryId]);
      
      subcategoryIds[subcategory.slug] = result.rows[0].id;
      console.log(`✅ Created subcategory: ${subcategory.name} (${subcategory.categorySlug})`);
    }
  }

  return subcategoryIds;
}

async function seedProducts(categoryIds, subcategoryIds) {
  console.log('🛒 Seeding products...');

  const products = [
    // Frutas - Cítricos
    {
      name: 'Naranjas',
      description: 'Sweet and juicy oranges, rich in vitamin C',
      price: 2.75,
      unit: 'kg',
      image_url: '/images/oranges.jpg',
      categorySlug: 'frutas',
      subcategorySlug: 'citricos',
      is_featured: false
    },
    {
      name: 'Limones',
      description: 'Fresh lemons for cooking and drinks',
      price: 1.99,
      unit: 'kg',
      image_url: '/images/lemons.jpg',
      categorySlug: 'frutas',
      subcategorySlug: 'citricos',
      is_featured: false
    },
    
    // Frutas - Tropicales
    {
      name: 'Bananas',
      description: 'Fresh yellow bananas, perfect for smoothies and snacks',
      price: 3.50,
      unit: 'kg',
      image_url: '/images/bananas.jpg',
      categorySlug: 'frutas',
      subcategorySlug: 'tropicales',
      is_featured: true
    },
    {
      name: 'Manzanas Rojas',
      description: 'Crisp red apples, great for eating fresh or cooking',
      price: 2.99,
      unit: 'kg',
      image_url: '/images/apples.jpg',
      categorySlug: 'frutas',
      subcategorySlug: 'tropicales',
      is_featured: true
    },
    
    // Vegetales - Verdes
    {
      name: 'Lechuga',
      description: 'Fresh lettuce for salads',
      price: 1.50,
      unit: 'piece',
      image_url: '/images/lettuce.jpg',
      categorySlug: 'vegetales',
      subcategorySlug: 'verdes',
      is_featured: false
    },
    {
      name: 'Espinaca',
      description: 'Fresh spinach leaves, perfect for salads',
      price: 2.80,
      unit: 'bunch',
      image_url: '/images/spinach.jpg',
      categorySlug: 'vegetales',
      subcategorySlug: 'verdes',
      is_featured: false
    },
    
    // Vegetales - Raíces
    {
      name: 'Zanahorias',
      description: 'Organic carrots, sweet and crunchy',
      price: 2.25,
      unit: 'kg',
      image_url: '/images/carrots.jpg',
      categorySlug: 'vegetales',
      subcategorySlug: 'raices',
      is_featured: true
    },
    {
      name: 'Papas',
      description: 'Fresh potatoes for cooking',
      price: 1.75,
      unit: 'kg',
      image_url: '/images/potatoes.jpg',
      categorySlug: 'vegetales',
      subcategorySlug: 'raices',
      is_featured: false
    },
    
    // Lácteos - Leche
    {
      name: 'Leche Entera',
      description: 'Fresh whole milk, 1 liter',
      price: 3.99,
      unit: 'liter',
      image_url: '/images/milk.jpg',
      categorySlug: 'lacteos',
      subcategorySlug: 'leche',
      is_featured: false
    },
    
    // Lácteos - Quesos
    {
      name: 'Queso Fresco',
      description: 'Fresh white cheese, perfect for cooking',
      price: 5.50,
      unit: 'kg',
      image_url: '/images/cheese.jpg',
      categorySlug: 'lacteos',
      subcategorySlug: 'quesos',
      is_featured: true
    },
    
    // Bebidas - Jugos
    {
      name: 'Jugo de Naranja',
      description: 'Fresh orange juice, 1 liter',
      price: 4.25,
      unit: 'liter',
      image_url: '/images/orange-juice.jpg',
      categorySlug: 'bebidas',
      subcategorySlug: 'jugos',
      is_featured: false
    },
    
    // Bebidas - Agua
    {
      name: 'Agua Natural',
      description: 'Pure natural water, 1.5 liter bottle',
      price: 1.25,
      unit: 'bottle',
      image_url: '/images/water.jpg',
      categorySlug: 'bebidas',
      subcategorySlug: 'agua',
      is_featured: false
    }
  ];

  for (const product of products) {
    const categoryId = categoryIds[product.categorySlug];
    const subcategoryId = subcategoryIds[product.subcategorySlug];
    
    // Check if product exists
    const existing = await query('SELECT id FROM products WHERE name = $1', [product.name]);
    
    if (existing.rows.length > 0) {
      console.log(`⏭️  Product '${product.name}' already exists`);
    } else {
      await query(`
        INSERT INTO products (id, name, description, price, unit, image_url, category_id, subcategory_id, is_active, is_featured, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        product.name,
        product.description,
        product.price,
        product.unit,
        product.image_url,
        categoryId,
        subcategoryId,
        true, // is_active
        product.is_featured
      ]);
      
      console.log(`✅ Created product: ${product.name} (${product.categorySlug}/${product.subcategorySlug})`);
    }
  }
}

async function seedAdminUser() {
  console.log('👤 Seeding admin user...');

  // Check if admin user exists
  const existing = await query('SELECT id FROM users WHERE email = $1', ['admin@grocery.com']);
  
  if (existing.rows.length > 0) {
    console.log('⏭️  Admin user already exists');
    return;
  }

  // Create admin user with hashed password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await query(`
    INSERT INTO users (id, email, password, first_name, last_name, role, is_active, created_at, updated_at)
    VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [
    'admin@grocery.com',
    hashedPassword,
    'Admin',
    'User',
    'ADMIN',
    true
  ]);
  
  console.log('✅ Created admin user (email: admin@grocery.com, password: admin123)');
}

async function runSeeding() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data if force reseed is enabled
    await clearExistingData();

    // Seed categories
    const categoryIds = await seedCategories();
    
    // Seed subcategories
    const subcategoryIds = await seedSubcategories(categoryIds);
    
    // Seed products
    await seedProducts(categoryIds, subcategoryIds);
    
    // Seed admin user
    await seedAdminUser();

    console.log('🎉 Database seeding completed successfully!');
    
    // Show summary
    const categoryCount = await query('SELECT COUNT(*) as count FROM categories');
    const subcategoryCount = await query('SELECT COUNT(*) as count FROM subcategories');
    const productCount = await query('SELECT COUNT(*) as count FROM products');
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    
    console.log('\n📊 Seeding Summary:');
    console.log(`  Categories: ${categoryCount.rows[0].count}`);
    console.log(`  Subcategories: ${subcategoryCount.rows[0].count}`);
    console.log(`  Products: ${productCount.rows[0].count}`);
    console.log(`  Users: ${userCount.rows[0].count}`);
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeeding().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  });
}

module.exports = runSeeding;