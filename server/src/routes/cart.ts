import { Router } from 'express';
import { prisma } from '../services/prisma';
import { optionalAuth, authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Simple helper to get a default user ID for anonymous users
const DEFAULT_USER_ID = 'anonymous-user';

// Helper function to ensure user exists (for anonymous users)
const ensureAnonymousUserExists = async (): Promise<string> => {
  try {
    // Check if default anonymous user exists
    let user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });

    // If not, create a default anonymous user
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'anonymous@example.com',
          password: 'temp',
          firstName: 'Anonymous',
          lastName: 'User',
          phone: '+1234567890'
        }
      });
    }

    return user.id;
  } catch (error) {
    console.error('Error ensuring anonymous user exists:', error);
    return DEFAULT_USER_ID;
  }
};

// Helper to get user ID from request (authenticated or anonymous)
const getUserId = async (req: AuthenticatedRequest): Promise<string> => {
  if (req.user) {
    return req.user.id;
  }
  // For anonymous users, use a default user
  return await ensureAnonymousUserExists();
};

// GET /api/cart - Get user's cart
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = await getUserId(req);
    
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
router.post('/items', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = await getUserId(req);

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
router.put('/items/:itemId', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = await getUserId(req);

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: itemId as string, 
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
        where: { id: itemId as string }
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
        where: { id: itemId as string },
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
router.delete('/items/:itemId', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;
    const userId = await getUserId(req);

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: itemId as string, 
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
      where: { id: itemId as string }
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
router.delete('/clear', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = await getUserId(req);

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

// POST /api/cart/checkout - Convert cart to order and checkout
router.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { deliveryAddressId, shippingAddress, paymentMethod, notes } = req.body;
    
    // User is guaranteed to exist because of authenticateToken middleware
    const userId = req.user!.id;

    // Validate required fields - need either deliveryAddressId OR shippingAddress
    if (!deliveryAddressId && !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Either deliveryAddressId or shippingAddress is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Get current cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            inventory: true
          }
        }
      }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Check inventory for all items
    for (const item of cartItems) {
      const availableStock = item.product.inventory?.quantity || 0;
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }
    }

    // Create or find shipping address
    let finalDeliveryAddressId: string;
    
    if (deliveryAddressId) {
      // Use existing address - verify it belongs to the user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: deliveryAddressId,
          userId
        }
      });
      
      if (!existingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery address ID or address does not belong to user'
        });
      }
      
      finalDeliveryAddressId = deliveryAddressId;
    } else {
      // Create new address from shippingAddress data
      if (userId !== 'anonymous-user') {
        // For authenticated users, create a new address record
        const address = await prisma.address.create({
          data: {
            userId,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country || 'Colombia',
            isDefault: false
          }
        });
        finalDeliveryAddressId = address.id;
      } else {
        // For anonymous users, create a temporary address (you might want to handle this differently)
        const address = await prisma.address.create({
          data: {
            userId: 'anonymous-user',
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country || 'Colombia',
            isDefault: false
          }
        });
        finalDeliveryAddressId = address.id;
      }
    }

    // Calculate order totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price.toString());
      return sum + (price * item.quantity);
    }, 0);
    const deliveryFee = subtotal >= 50 ? 0 : 5.99; // Free delivery over $50
    const total = subtotal + deliveryFee;

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId,
        deliveryAddressId: finalDeliveryAddressId,
        paymentMethod: paymentMethod.type || paymentMethod,
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        total: Math.round(total * 100) / 100,
        status: 'PENDING',
        notes: notes || '',
        orderItems: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.product.price.toString()),
            subtotal: parseFloat(item.product.price.toString()) * item.quantity
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        deliveryAddress: true
      }
    });

    // Update inventory
    for (const item of cartItems) {
      if (item.product.inventory) {
        await prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }
    }

    // Clear the cart
    await prisma.cartItem.deleteMany({
      where: { userId }
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        message: 'Order placed successfully'
      },
      message: 'Checkout completed successfully'
    });

  } catch (error) {
    console.error('Error during checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;