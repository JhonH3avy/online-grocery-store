import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// GET /api/products - Get all products (with filtering)
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, search, limit = '20', offset = '0', featured, page } = req.query;
    
    // Build where clause for filtering
    const where: any = {
      isActive: true, // Only show active products
    };

    // Filter by category (using slug or name)
    if (category && typeof category === 'string') {
      where.OR = [
        { category: { slug: category } },
        { category: { name: { contains: category, mode: 'insensitive' } } }
      ];
    }

    // Filter by subcategory (using slug or name)
    if (subcategory && typeof subcategory === 'string') {
      where.subcategory = {
        OR: [
          { slug: subcategory },
          { name: { contains: subcategory, mode: 'insensitive' } }
        ]
      };
    }

    // Filter by search term
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Filter by featured
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Pagination
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = page ? (parseInt(page as string, 10) - 1) * limitNum : parseInt(offset as string, 10);

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products with relations
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
        inventory: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offsetNum,
      take: limitNum,
    });

    // Transform products to match frontend expectations
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      unit: product.unit,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category.slug,
      subcategory: product.subcategory.slug,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      featured: product.isFeatured,
      stock: product.inventory?.quantity || 0,
      available: (product.inventory?.quantity || 0) > 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        products: transformedProducts,
        total,
        page: Math.floor(offsetNum / limitNum) + 1,
        limit: limitNum,
        hasMore: offsetNum + limitNum < total
      },
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products'
    });
  }
});

// GET /api/products/search - Search products (must be before /:id route)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = '20' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchTerm = q.toLowerCase();
    const limitNum = parseInt(limit as string, 10);
    
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { category: { slug: { contains: searchTerm, mode: 'insensitive' } } },
          { subcategory: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { subcategory: { slug: { contains: searchTerm, mode: 'insensitive' } } }
        ]
      },
      include: {
        category: true,
        subcategory: true,
        inventory: true,
      },
      take: limitNum,
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' }
      ]
    });

    // Transform products to match frontend expectations
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      unit: product.unit,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category.slug,
      subcategory: product.subcategory.slug,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      featured: product.isFeatured,
      stock: product.inventory?.quantity || 0,
      available: (product.inventory?.quantity || 0) > 0,
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        products: transformedProducts,
        total: transformedProducts.length,
        page: 1,
        limit: limitNum,
        hasMore: false
      },
      message: `Found ${transformedProducts.length} products matching '${q}'`
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

// GET /api/products/featured - Get featured products (must be before /:id route)
router.get('/featured', async (req, res) => {
  try {
    const { limit = '8' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const featuredProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true
      },
      include: {
        category: true,
        subcategory: true,
        inventory: true,
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform products to match frontend expectations
    const transformedProducts = featuredProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      unit: product.unit,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category.slug,
      subcategory: product.subcategory.slug,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      featured: product.isFeatured,
      stock: product.inventory?.quantity || 0,
      available: (product.inventory?.quantity || 0) > 0,
    }));
    
    return res.status(200).json({
      success: true,
      data: transformedProducts,
      message: 'Featured products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured products'
    });
  }
});

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    const categoryProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { category: { slug: categoryId } },
          { category: { id: categoryId } },
          { category: { name: { contains: categoryId, mode: 'insensitive' } } }
        ]
      },
      include: {
        category: true,
        subcategory: true,
        inventory: true,
      },
      take: limitNum,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform products to match frontend expectations
    const transformedProducts = categoryProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      unit: product.unit,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category.slug,
      subcategory: product.subcategory.slug,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      featured: product.isFeatured,
      stock: product.inventory?.quantity || 0,
      available: (product.inventory?.quantity || 0) > 0,
    }));
    
    return res.status(200).json({
      success: true,
      data: transformedProducts,
      message: `Products for category '${categoryId}' retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products by category'
    });
  }
});

// GET /api/products/availability/:id - Check product availability
router.get('/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const stock = product.inventory?.quantity || 0;
    
    return res.status(200).json({
      success: true,
      data: {
        available: stock > 0 && product.isActive,
        stock: stock,
        productId: product.id,
        productName: product.name,
        isActive: product.isActive
      },
      message: 'Product availability checked successfully'
    });
  } catch (error) {
    console.error('Error checking product availability:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check product availability'
    });
  }
});

// GET /api/products/:id - Get single product details (must be last among GET routes)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        inventory: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Transform product to match frontend expectations
    const transformedProduct = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      unit: product.unit,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category.slug,
      subcategory: product.subcategory.slug,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      featured: product.isFeatured,
      stock: product.inventory?.quantity || 0,
      available: (product.inventory?.quantity || 0) > 0 && product.isActive,
      isActive: product.isActive,
      reviews: product.reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        userName: `${review.user.firstName} ${review.user.lastName}`,
        createdAt: review.createdAt
      })),
      avgRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length 
        : 0,
      reviewCount: product.reviews.length
    };

    return res.status(200).json({
      success: true,
      data: transformedProduct,
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve product'
    });
  }
});

export default router;
