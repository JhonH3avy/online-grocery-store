import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// Mock products data (matching the frontend structure)
const productsData = [
  // Frutas Cítricas
  {
    id: 'citrus-1',
    name: 'Naranjas Frescas',
    price: 8500,
    unit: 'kg',
    description: 'Naranjas jugosas y dulces, perfectas para jugos frescos o consumo directo. Ricas en vitamina C y antioxidantes.',
    imageUrl: 'https://images.unsplash.com/photo-1661669273498-ee01566be6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMG9yYW5nZXMlMjBjaXRydXMlMjBmcnVpdHN8ZW58MXx8fHwxNzU3MzQyMTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'citricas',
    featured: true,
    stock: 25
  },
  {
    id: 'citrus-2',
    name: 'Limones Frescos',
    price: 12500,
    unit: 'kg',
    description: 'Limones ácidos y aromáticos, ideales para aderezos, bebidas y cocina. Excelente fuente de vitamina C.',
    imageUrl: 'https://images.unsplash.com/photo-1718196917011-801cddb84334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGxlbW9ucyUyMGNpdHJ1c3xlbnwxfHx8fDE3NTczNDQ5NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'citricas',
    featured: false,
    stock: 15
  },
  // Frutas Tropicales
  {
    id: 'tropical-1',
    name: 'Piña Dorada',
    price: 6800,
    unit: 'kg',
    description: 'Piña madura y dulce, con pulpa jugosa y aromática. Rica en bromelina y vitaminas. Perfecta para postres.',
    imageUrl: 'https://images.unsplash.com/photo-1618434025772-961657d649d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHBpbmVhcHBsZSUyMHRyb3BpY2FsJTIwZnJ1aXR8ZW58MXx8fHwxNzU3MzM1Njc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'tropicales',
    featured: true,
    stock: 12
  },
  {
    id: 'tropical-2',
    name: 'Mango Maduro',
    price: 9500,
    unit: 'kg',
    description: 'Mangos maduros y cremosos, con sabor dulce tropical. Ideales para batidos, postres o consumo fresco.',
    imageUrl: 'https://images.unsplash.com/photo-1734163075572-8948e799e42c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMG1hbmdvJTIwdHJvcGljYWx8ZW58MXx8fHwxNzU3MzAyODI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'tropicales',
    featured: false,
    stock: 8
  },
  // Verduras - Hojas Verdes
  {
    id: 'greens-1',
    name: 'Lechuga Romana',
    price: 4500,
    unit: 'kg',
    description: 'Lechuga romana fresca y crujiente, ideal para ensaladas césar y sandwiches. Rica en folatos y vitamina K.',
    imageUrl: 'https://images.unsplash.com/photo-1720456764346-1abff7d43efe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGxldHR1Y2UlMjBncmVlbiUyMGxlYWZ5fGVufDF8fHx8MTc1NzM0NDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'hojas-verdes',
    featured: false,
    stock: 20
  },
  {
    id: 'greens-2',
    name: 'Espinaca Tierna',
    price: 8500,
    unit: 'kg',
    description: 'Espinaca fresca de hojas tiernas, perfecta para ensaladas, batidos verdes y salteados. Alta en hierro.',
    imageUrl: 'https://images.unsplash.com/photo-1634731201932-9bd92839bea2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNwaW5hY2glMjBsZWF2ZXN8ZW58MXx8fHwxNzU3MjQwODU0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'hojas-verdes',
    featured: true,
    stock: 18
  },
  // Add more products as needed...
];

// GET /api/products - Get all products (with filtering)
router.get('/', (req, res) => {
  try {
    const { category, subcategory, search, limit = '20', offset = '0', featured } = req.query;
    
    let filteredProducts = [...productsData];
    
    // Filter by category
    if (category && typeof category === 'string') {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    // Filter by subcategory
    if (subcategory && typeof subcategory === 'string') {
      filteredProducts = filteredProducts.filter(p => p.subcategory === subcategory);
    }
    
    // Filter by search term
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by featured
    if (featured === 'true') {
      filteredProducts = filteredProducts.filter(p => p.featured);
    }
    
    // Pagination
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(offsetNum, offsetNum + limitNum);
    
    return res.status(200).json({
      success: true,
      data: {
        products: paginatedProducts,
        total,
        page: Math.floor(offsetNum / limitNum) + 1,
        limit: limitNum,
        hasMore: offsetNum + limitNum < total
      },
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products'
    });
  }
});

// GET /api/products/search - Search products (must be before /:id route)
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const searchTerm = q.toLowerCase();
    const searchResults = productsData.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.subcategory.toLowerCase().includes(searchTerm)
    );
    
    return res.status(200).json({
      success: true,
      data: searchResults,
      message: `Found ${searchResults.length} products matching '${q}'`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

// GET /api/products/featured - Get featured products (must be before /:id route)
router.get('/featured', (req, res) => {
  try {
    const featuredProducts = productsData.filter(p => p.featured);
    
    return res.status(200).json({
      success: true,
      data: featuredProducts,
      message: 'Featured products retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured products'
    });
  }
});

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    const categoryProducts = productsData.filter(p => p.category === categoryId);
    
    return res.status(200).json({
      success: true,
      data: categoryProducts,
      message: `Products for category '${categoryId}' retrieved successfully`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve products by category'
    });
  }
});

// GET /api/products/availability/:id - Check product availability
router.get('/availability/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = productsData.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        available: product.stock > 0,
        stock: product.stock,
        productId: product.id,
        productName: product.name
      },
      message: 'Product availability checked successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check product availability'
    });
  }
});

// GET /api/products/:id - Get single product details (must be last among GET routes)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = productsData.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve product'
    });
  }
});

export default router;
