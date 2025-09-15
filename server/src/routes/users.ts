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
router.get('/addresses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const addresses = await prisma.address.findMany({
      where: { 
        userId,
        isDeleted: false // Only show non-deleted addresses
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/users/addresses - Add new address
router.post('/addresses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { street, city, state, zipCode, country, isDefault } = req.body;

    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Street, city, state, and zip code are required',
      });
    }

    // Check for duplicate address
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: (country || 'Colombia').trim()
      }
    });

    if (existingAddress) {
      return res.status(409).json({
        success: false,
        error: 'An address with these details already exists',
      });
    }

    // If this address is being set as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: (country || 'Colombia').trim(),
        isDefault: isDefault || false
      }
    });

    return res.status(201).json({
      success: true,
      data: address,
      message: 'Address added successfully',
    });
  } catch (error) {
    console.error('Add address error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/users/addresses/:id - Update address
router.put('/addresses/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const addressId = req.params.id as string;
    const { street, city, state, zipCode, country, isDefault } = req.body;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id: addressId, 
        userId,
        isDeleted: false
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    // If this address is being set as default, unset other default addresses
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        street: street || existingAddress.street,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        zipCode: zipCode || existingAddress.zipCode,
        country: country || existingAddress.country,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      }
    });

    return res.json({
      success: true,
      data: updatedAddress,
      message: 'Address updated successfully',
    });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// DELETE /api/users/addresses/:id - Soft delete address
router.delete('/addresses/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const addressId = req.params.id as string;

    // Check if address belongs to user and is not already deleted
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id: addressId, 
        userId,
        isDeleted: false
      }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    // Soft delete the address
    await prisma.address.update({
      where: { id: addressId },
      data: { 
        isDeleted: true,
        isDefault: false // Remove default status when deleting
      }
    });

    return res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete address error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
