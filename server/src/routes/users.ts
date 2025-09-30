import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { AddressModel } from '../models/Address';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
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

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Format user data for response (exclude password)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return res.json({
      success: true,
      data: userData,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = updateProfileSchema.parse(req.body);

    // Check if email is being updated and if it's already taken
    if (validatedData.email) {
      const existingUser = await UserModel.findByEmail(validatedData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken',
        });
      }
    }

    const updateData: any = {};
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.firstName) updateData.firstName = validatedData.firstName;
    if (validatedData.lastName) updateData.lastName = validatedData.lastName;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;

    const updatedUser = await UserModel.update(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Format user data for response (exclude password)
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.is_active,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    };

    return res.json({
      success: true,
      data: userData,
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
      error: 'Failed to update profile',
    });
  }
});

// GET /api/users/addresses - Get user's addresses
router.get('/addresses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const addresses = await AddressModel.findByUserId(userId);

    return res.json({
      success: true,
      data: addresses,
      message: 'Addresses retrieved successfully',
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve addresses',
    });
  }
});

// POST /api/users/addresses - Create new address
router.post('/addresses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = createAddressSchema.parse(req.body);

    // If this is being set as default, clear other default flags first
    if (validatedData.isDefault) {
      await AddressModel.clearDefaultFlag(userId);
    }

    const address = await AddressModel.create({
      userId: userId,
      street: validatedData.street,
      city: validatedData.city,
      state: validatedData.state,
      zipCode: validatedData.zipCode,
      country: validatedData.country,
      isDefault: validatedData.isDefault || false,
    });

    return res.status(201).json({
      success: true,
      data: address,
      message: 'Address created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create address error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create address',
    });
  }
});

// PUT /api/users/addresses/:id - Update address
router.put('/addresses/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const validatedData = updateAddressSchema.parse(req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Address ID is required',
      });
    }

    // Check if address exists and belongs to user
    const existingAddress = await AddressModel.findById(id, userId);
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    // If this is being set as default, clear other default flags first
    if (validatedData.isDefault) {
      await AddressModel.clearDefaultFlag(userId);
    }

    const addressUpdateData: any = {};
    if (validatedData.street) addressUpdateData.street = validatedData.street;
    if (validatedData.city) addressUpdateData.city = validatedData.city;
    if (validatedData.state) addressUpdateData.state = validatedData.state;
    if (validatedData.zipCode) addressUpdateData.zipCode = validatedData.zipCode;
    if (validatedData.country) addressUpdateData.country = validatedData.country;
    if (validatedData.isDefault !== undefined) addressUpdateData.isDefault = validatedData.isDefault;

    const updatedAddress = await AddressModel.update(id, userId, addressUpdateData);

    if (!updatedAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    return res.json({
      success: true,
      data: updatedAddress,
      message: 'Address updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update address error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update address',
    });
  }
});

// DELETE /api/users/addresses/:id - Delete address
router.delete('/addresses/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Address ID is required',
      });
    }

    // Check if address exists and belongs to user
    const existingAddress = await AddressModel.findById(id, userId);
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    const deleted = await AddressModel.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    return res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete address',
    });
  }
});

export default router;