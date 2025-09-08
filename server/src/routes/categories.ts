import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// GET /api/categories - Get all categories with subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories'
    });
  }
});

// GET /api/categories/:id - Get specific category with subcategories
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
      message: 'Category retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve category'
    });
  }
});

// GET /api/categories/:id/subcategories - Get subcategories for a category
router.get('/:id/subcategories', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if category exists
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId: id },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      data: subcategories,
      message: 'Subcategories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve subcategories'
    });
  }
});

export default router;
