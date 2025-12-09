import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../services/drizzle';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
});

const createAddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('Colombia'),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  street: z.string().min(1, 'Street is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  zipCode: z.string().min(1, 'ZIP code is required').optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/users/profile - Get user profile (requires authentication)
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = rows[0];

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
      const existingRows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);
      const existingUser = existingRows[0];

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken by another user',
        });
      }
    }

    // Update user profile
    const updatedRows = await db
      .update(users)
      .set({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
      });
    const updatedUser = updatedRows[0];

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