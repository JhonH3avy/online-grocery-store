import { Router } from 'express';
import { CategoryModel } from '../models/Category';

const router = Router();

// GET /api/categories - Get all categories with subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await CategoryModel.findAll();

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

// GET /api/categories/:identifier - Get specific category with subcategories (by ID or name)
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let category;
    
    // Check if it looks like a UUID (backward compatibility)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUuid) {
      category = await CategoryModel.findById(identifier);
    } else {
      category = await CategoryModel.findByName(identifier);
    }

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

// GET /api/categories/:identifier/subcategories - Get subcategories for a category (by ID or name)
router.get('/:identifier/subcategories', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let categoryExists;
    let subcategories;
    
    // Check if it looks like a UUID (backward compatibility)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    if (isUuid) {
      categoryExists = await CategoryModel.categoryExists(identifier);
      if (categoryExists) {
        subcategories = await CategoryModel.findSubcategories(identifier);
      }
    } else {
      categoryExists = await CategoryModel.categoryExistsByName(identifier);
      if (categoryExists) {
        subcategories = await CategoryModel.findSubcategoriesByName(identifier);
      }
    }

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

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
