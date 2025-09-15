import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
});

// GET /api/users/profile - Get user profile (requires authentication)
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        isActive: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/users/profile - Update user profile (requires authentication)
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const validatedData = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if email is already taken by another user
    if (validatedData.email !== req.user!.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken by another user',
        });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        isActive: true,
      }
    });

    return res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/users/addresses - Get user addresses
router.get('/addresses', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Get addresses endpoint not implemented yet',
  });
});

// POST /api/users/addresses - Add new address
router.post('/addresses', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Add address endpoint not implemented yet',
  });
});

export default router;
