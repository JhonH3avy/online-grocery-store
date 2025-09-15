import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// Simple helper to get a default user ID
const DEFAULT_USER_ID = 'default-user';

// Helper function to ensure user exists
const ensureUserExists = async (): Promise<string> => {
  try {
    // Check if default user exists
    let user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });

    // If not, try to find the test user
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: 'test@example.com' }
      });
    }

    // If still no user, create a default one
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'default@example.com',
          password: 'temp',
          firstName: 'Default',
          lastName: 'User',
          phone: '+1234567890'
        }
      });
    }

    return user.id;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return DEFAULT_USER_ID;
  }
};

// GET /api/cart - Get user's cart
router.get('/', async (req, res) => {
  try {
    const userId = await ensureUserExists();
    
    // Get all cart items for the user with product details
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            subcategory: true,
            inventory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price.toString());
      return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    const cart = {
      id: `cart-${userId}`,
      userId,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        total: parseFloat(item.product.price.toString()) * item.quantity,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      createdAt: cartItems[0]?.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/cart/items - Add item to cart
router.post('/items', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = await ensureUserExists();

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and positive quantity are required'
      });
    }

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: { 
        id: productId, 
        isActive: true 
      },
      include: { inventory: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    // Check inventory
    const availableStock = product.inventory?.quantity || 0;
    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items available in stock`
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + quantity;
      
      // Check if new quantity exceeds stock
      if (availableStock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more items. Only ${availableStock - existingCartItem.quantity} more available.`
        });
      }

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity }
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity
        }
      });
    }

    // Get updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            subcategory: true,
            inventory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price.toString());
      return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    const cart = {
      id: `cart-${userId}`,
      userId,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        total: parseFloat(item.product.price.toString()) * item.quantity,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      createdAt: cartItems[0]?.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: cart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/cart/items/:itemId - Update cart item quantity
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = await ensureUserExists();

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: itemId, 
        userId 
      },
      include: {
        product: {
          include: { inventory: true }
        }
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await prisma.cartItem.delete({
        where: { id: itemId }
      });
    } else {
      // Check inventory
      const availableStock = cartItem.product.inventory?.quantity || 0;
      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`
        });
      }

      // Update cart item
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }

    // Get updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            subcategory: true,
            inventory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price.toString());
      return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    const cart = {
      id: `cart-${userId}`,
      userId,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        total: parseFloat(item.product.price.toString()) * item.quantity,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      createdAt: cartItems[0]?.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: cart,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = await ensureUserExists();

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: itemId, 
        userId 
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    // Get updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            subcategory: true,
            inventory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price.toString());
      return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    const cart = {
      id: `cart-${userId}`,
      userId,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        total: parseFloat(item.product.price.toString()) * item.quantity,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      })),
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      createdAt: cartItems[0]?.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: cart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', async (req, res) => {
  try {
    const userId = await ensureUserExists();

    // Delete all cart items for the user
    await prisma.cartItem.deleteMany({
      where: { userId }
    });

    const emptyCart = {
      id: `cart-${userId}`,
      userId,
      items: [],
      totalItems: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: emptyCart,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;