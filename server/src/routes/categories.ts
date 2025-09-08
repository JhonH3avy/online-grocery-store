import { Router } from 'express';

const router = Router();

// GET /api/categories - Get all categories with subcategories
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Get categories endpoint not implemented yet',
  });
});

// GET /api/categories/:id - Get specific category
router.get('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Get category by ID endpoint not implemented yet',
  });
});

// GET /api/categories/:id/subcategories - Get subcategories
router.get('/:id/subcategories', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Get subcategories endpoint not implemented yet',
  });
});

export default router;
