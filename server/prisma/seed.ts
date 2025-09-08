import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create categories
  console.log('📂 Creating categories...');
  const fruitsCategory = await prisma.category.create({
    data: {
      name: 'Frutas',
      slug: 'frutas',
    },
  });

  const vegetablesCategory = await prisma.category.create({
    data: {
      name: 'Vegetales',
      slug: 'vegetales',
    },
  });

  const dairyCategory = await prisma.category.create({
    data: {
      name: 'Lácteos',
      slug: 'lacteos',
    },
  });

  const beveragesCategory = await prisma.category.create({
    data: {
      name: 'Bebidas',
      slug: 'bebidas',
    },
  });

  // Create subcategories
  console.log('📁 Creating subcategories...');
  const citrusSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Cítricos',
      slug: 'citricos',
      categoryId: fruitsCategory.id,
    },
  });

  const tropicalSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Tropicales',
      slug: 'tropicales',
      categoryId: fruitsCategory.id,
    },
  });

  const leafySubcategory = await prisma.subcategory.create({
    data: {
      name: 'Verdes',
      slug: 'verdes',
      categoryId: vegetablesCategory.id,
    },
  });

  const rootSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Raíces',
      slug: 'raices',
      categoryId: vegetablesCategory.id,
    },
  });

  const milkSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Leche',
      slug: 'leche',
      categoryId: dairyCategory.id,
    },
  });

  const cheeseSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Quesos',
      slug: 'quesos',
      categoryId: dairyCategory.id,
    },
  });

  const juicesSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Jugos',
      slug: 'jugos',
      categoryId: beveragesCategory.id,
    },
  });

  const waterSubcategory = await prisma.subcategory.create({
    data: {
      name: 'Agua',
      slug: 'agua',
      categoryId: beveragesCategory.id,
    },
  });

  // Create products
  console.log('🛒 Creating products...');
  const products = await Promise.all([
    // Fruits
    prisma.product.create({
      data: {
        name: 'Bananas',
        description: 'Fresh yellow bananas, perfect for smoothies and snacks',
        price: 3.50,
        unit: 'kg',
        imageUrl: '/images/bananas.jpg',
        categoryId: fruitsCategory.id,
        subcategoryId: tropicalSubcategory.id,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Manzanas Rojas',
        description: 'Crisp red apples, great for eating fresh or cooking',
        price: 2.99,
        unit: 'kg',
        imageUrl: '/images/apples.jpg',
        categoryId: fruitsCategory.id,
        subcategoryId: tropicalSubcategory.id,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Naranjas',
        description: 'Sweet and juicy oranges, rich in vitamin C',
        price: 2.75,
        unit: 'kg',
        imageUrl: '/images/oranges.jpg',
        categoryId: fruitsCategory.id,
        subcategoryId: citrusSubcategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Limones',
        description: 'Fresh lemons for cooking and drinks',
        price: 1.99,
        unit: 'kg',
        imageUrl: '/images/lemons.jpg',
        categoryId: fruitsCategory.id,
        subcategoryId: citrusSubcategory.id,
      },
    }),

    // Vegetables
    prisma.product.create({
      data: {
        name: 'Lechuga',
        description: 'Fresh lettuce for salads',
        price: 1.50,
        unit: 'piece',
        imageUrl: '/images/lettuce.jpg',
        categoryId: vegetablesCategory.id,
        subcategoryId: leafySubcategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Zanahorias',
        description: 'Organic carrots, sweet and crunchy',
        price: 2.25,
        unit: 'kg',
        imageUrl: '/images/carrots.jpg',
        categoryId: vegetablesCategory.id,
        subcategoryId: rootSubcategory.id,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Espinaca',
        description: 'Fresh spinach leaves, perfect for salads',
        price: 2.80,
        unit: 'bunch',
        imageUrl: '/images/spinach.jpg',
        categoryId: vegetablesCategory.id,
        subcategoryId: leafySubcategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Papas',
        description: 'Fresh potatoes for cooking',
        price: 1.75,
        unit: 'kg',
        imageUrl: '/images/potatoes.jpg',
        categoryId: vegetablesCategory.id,
        subcategoryId: rootSubcategory.id,
      },
    }),

    // Dairy
    prisma.product.create({
      data: {
        name: 'Leche Entera',
        description: 'Fresh whole milk, 1 liter',
        price: 3.99,
        unit: 'liter',
        imageUrl: '/images/milk.jpg',
        categoryId: dairyCategory.id,
        subcategoryId: milkSubcategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Queso Fresco',
        description: 'Fresh white cheese, perfect for cooking',
        price: 5.50,
        unit: 'kg',
        imageUrl: '/images/cheese.jpg',
        categoryId: dairyCategory.id,
        subcategoryId: cheeseSubcategory.id,
        isFeatured: true,
      },
    }),

    // Beverages
    prisma.product.create({
      data: {
        name: 'Jugo de Naranja',
        description: 'Fresh orange juice, 1 liter',
        price: 4.25,
        unit: 'liter',
        imageUrl: '/images/orange-juice.jpg',
        categoryId: beveragesCategory.id,
        subcategoryId: juicesSubcategory.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Agua Natural',
        description: 'Pure natural water, 1.5 liter bottle',
        price: 1.25,
        unit: 'bottle',
        imageUrl: '/images/water.jpg',
        categoryId: beveragesCategory.id,
        subcategoryId: waterSubcategory.id,
      },
    }),
  ]);

  // Create inventory for all products
  console.log('📦 Creating inventory...');
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: Math.floor(Math.random() * 100) + 20, // Random quantity between 20-120
        lowStock: 10,
      },
    });
  }

  // Create a test user
  console.log('👤 Creating test user...');
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashed_password_here', // In real app, this would be properly hashed
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    },
  });

  // Create test address
  await prisma.address.create({
    data: {
      userId: testUser.id,
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA',
      isDefault: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:
  - ${await prisma.category.count()} categories
  - ${await prisma.subcategory.count()} subcategories  
  - ${await prisma.product.count()} products
  - ${await prisma.inventory.count()} inventory records
  - ${await prisma.user.count()} users
  - ${await prisma.address.count()} addresses`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
