import { Router } from 'express';
import { ProductModel } from '../models/Product';
import { db } from '../services/drizzle';
import { products, categories, subcategories, inventory, reviews, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// GET /api/products - Get all products (with filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      subcategory, 
      categoryId,    // Support legacy ID-based filtering
      subcategoryId, // Support legacy ID-based filtering
      search, 
      limit = '20', 
      offset = '0', 
      featured, 
      page,
      minPrice,
      maxPrice 
    } = req.query;
    
    // Parse pagination parameters
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50); // Max 50
    const pageNum = parseInt(page as string, 10) || 1;

    // Build search options
    const searchOptions: any = {
      page: pageNum,
      limit: limitNum,
    };

    // Support filtering by category/subcategory names (preferred) or IDs (legacy)
    if (category) searchOptions.categoryName = category as string;
    if (subcategory) searchOptions.subcategoryName = subcategory as string;
    if (categoryId) searchOptions.categoryId = categoryId as string;
    if (subcategoryId) searchOptions.subcategoryId = subcategoryId as string;
    if (search) searchOptions.search = search as string;
    if (featured === 'true') searchOptions.featured = true;
    if (minPrice) searchOptions.minPrice = parseFloat(minPrice as string);
    if (maxPrice) searchOptions.maxPrice = parseFloat(maxPrice as string);

    // Get products using the model
    const { products, total } = await ProductModel.list(searchOptions);

    return res.json({
      success: true,
      data: {
        products: products,
        pagination: {
          total: total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasMore: pageNum * limitNum < total
        }
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
    
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);
    
    const { products } = await ProductModel.list({
      search: q,
      limit: limitNum,
      page: 1
    });

    return res.status(200).json({
      success: true,
      data: products,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
    
    const products = await ProductModel.getFeatured(limit);

    return res.status(200).json({
      success: true,
      data: products,
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

// GET /api/products/category/:categoryName - Get products by category name
router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    
    // Try to get by category name first (slug), fallback to ID for backward compatibility
    let products;
    
    // Check if it looks like a UUID (backward compatibility)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryName);
    
    if (isUuid) {
      products = await ProductModel.getByCategory(categoryName, limit);
    } else {
      products = await ProductModel.getByCategoryName(categoryName, limit);
    }

    return res.status(200).json({
      success: true,
      data: products,
      message: 'Category products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve category products'
    });
  }
});

// GET /api/products/subcategory/:subcategoryName - Get products by subcategory name
router.get('/subcategory/:subcategoryName', async (req, res) => {
  try {
    const { subcategoryName } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    
    const products = await ProductModel.getBySubcategoryName(subcategoryName, limit);

    return res.status(200).json({
      success: true,
      data: products,
      message: 'Subcategory products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching subcategory products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve subcategory products'
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch product with relations using Drizzle
    const productRows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const product = productRows[0] as any;

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Load related category, subcategory, inventory
    const [categoryRow, subcategoryRow, inventoryRow] = await Promise.all([
      db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1),
      db.select().from(subcategories).where(eq(subcategories.id, product.subcategoryId)).limit(1),
      db.select().from(inventory).where(eq(inventory.productId, product.id)).limit(1),
    ]);

    const reviewRows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.productId, product.id)));

    // Transform product data to include enhanced fields
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      featured: product.isFeatured,
      stock: (inventoryRow[0] as any)?.quantity || 0,
      available: ((inventoryRow[0] as any)?.quantity || 0) > 0 && product.isActive,
      isActive: product.isActive,
      reviews: reviewRows.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: `${r.userFirstName} ${r.userLastName}`,
        createdAt: r.createdAt,
      })),
      avgRating: reviewRows.length > 0
        ? reviewRows.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewRows.length
        : 0,
      reviewCount: reviewRows.length
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