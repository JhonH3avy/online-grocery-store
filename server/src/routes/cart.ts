import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';
import { UserModel } from '../models/User';
import { AddressModel } from '../models/Address';

const router = Router();

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

const updateCartItemSchema = z.object({
  quantity: z.number().min(0, 'Quantity must be 0 or greater'), // Allow 0 to remove item
});

const guestCartSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })),
});

// Helper function to ensure user exists (for guest cart conversion)
const ensureUserExists = async (email: string, sessionId: string) => {
  let user = await UserModel.findByEmail(email);
  
  if (!user) {
    // Create guest user
    user = await UserModel.create({
      email: email,
      password: 'GUEST_USER', // Guest users don't have real passwords
      firstName: 'Guest',
      lastName: 'User',
      role: 'CUSTOMER'
    });
  }
  
  return user;
};

// GET /api/cart - Get current user's cart
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const cartSummary = await CartModel.getCartSummary(userId);

    return res.json({
      success: true,
      data: cartSummary,
      message: 'Cart retrieved successfully',
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve cart',
    });
  }
});

// POST /api/cart - Add item to cart
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = addToCartSchema.parse(req.body);

    // Verify product exists and is active
    const product = await ProductModel.findById(validatedData.productId);
    if (!product || !product.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Product not found or not available',
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await CartModel.findCartItem(userId, validatedData.productId);

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + validatedData.quantity;
      await CartModel.updateQuantity(userId, validatedData.productId, newQuantity);
    } else {
      // Add new item
      await CartModel.addItem(userId, validatedData.productId, validatedData.quantity);
    }

    // Return updated cart
    const cartSummary = await CartModel.getCartSummary(userId);

    return res.status(201).json({
      success: true,
      data: cartSummary,
      message: 'Item added to cart successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Add to cart error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
    });
  }
});

// PUT /api/cart/:productId - Update cart item quantity
router.put('/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;
    const validatedData = updateCartItemSchema.parse(req.body);

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required',
      });
    }

    // Check if cart item exists
    const cartItem = await CartModel.findCartItem(userId, productId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
      });
    }

    if (validatedData.quantity === 0) {
      // Remove item from cart
      await CartModel.removeItem(userId, productId);
    } else {
      // Update quantity
      await CartModel.updateQuantity(userId, productId, validatedData.quantity);
    }

    // Return updated cart
    const cartSummary = await CartModel.getCartSummary(userId);

    return res.json({
      success: true,
      data: cartSummary,
      message: 'Cart updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update cart error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update cart',
    });
  }
});

// DELETE /api/cart/:productId - Remove item from cart
router.delete('/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required',
      });
    }

    // Check if cart item exists
    const cartItem = await CartModel.findCartItem(userId, productId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
      });
    }

    await CartModel.removeItem(userId, productId);

    // Return updated cart
    const cartSummary = await CartModel.getCartSummary(userId);

    return res.json({
      success: true,
      data: cartSummary,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
    });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    await CartModel.clearCart(userId);

    return res.json({
      success: true,
      data: { items: [], totalItems: 0, subtotal: 0 },
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
    });
  }
});

export default router;