import { Router } from 'express';

const router = Router();

// Mock cart storage (in production, this would be in database with user sessions)
const mockCarts: Record<string, any> = {};

// Helper function to get cart ID (in production, this would be based on user session/JWT)
const getCartId = (req: any) => {
  // For now, use a default cart ID. In production, extract from JWT token or session
  return req.headers['x-cart-id'] || 'default-cart';
};

// Helper function to get or create cart
const getOrCreateCart = (cartId: string) => {
  if (!mockCarts[cartId]) {
    mockCarts[cartId] = {
      id: cartId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  return mockCarts[cartId];
};

// Helper function to calculate cart totals
const calculateCartTotals = (cart: any) => {
  const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const totalPrice = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  
  return {
    ...cart,
    totalItems,
    totalPrice,
    updatedAt: new Date().toISOString()
  };
};

// GET /api/cart - Get user's cart
router.get('/', (req, res) => {
  try {
    const cartId = getCartId(req);
    const cart = getOrCreateCart(cartId);
    const cartWithTotals = calculateCartTotals(cart);
    
    return res.status(200).json({
      success: true,
      data: cartWithTotals,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve cart'
    });
  }
});

// POST /api/cart/items - Add item to cart
router.post('/items', (req, res) => {
  try {
    const cartId = getCartId(req);
    const { productId, quantity = 1, price, name, unit, imageUrl } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const cart = getOrCreateCart(cartId);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item: any) => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].updatedAt = new Date().toISOString();
    } else {
      // Add new item to cart
      const newItem = {
        id: `${cartId}-${productId}-${Date.now()}`,
        productId,
        quantity,
        price: price || 0,
        name: name || 'Unknown Product',
        unit: unit || 'kg',
        imageUrl: imageUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      cart.items.push(newItem);
    }
    
    const cartWithTotals = calculateCartTotals(cart);
    mockCarts[cartId] = cartWithTotals;
    
    return res.status(201).json({
      success: true,
      data: cart.items[existingItemIndex >= 0 ? existingItemIndex : cart.items.length - 1],
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', (req, res) => {
  try {
    const cartId = getCartId(req);
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }
    
    const cart = getOrCreateCart(cartId);
    const itemIndex = cart.items.findIndex((item: any) => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }
    
    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].updatedAt = new Date().toISOString();
    }
    
    const cartWithTotals = calculateCartTotals(cart);
    mockCarts[cartId] = cartWithTotals;
    
    return res.status(200).json({
      success: true,
      data: quantity === 0 ? null : cart.items[itemIndex],
      message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update cart item'
    });
  }
});

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', (req, res) => {
  try {
    const cartId = getCartId(req);
    const { id } = req.params;
    
    const cart = getOrCreateCart(cartId);
    const itemIndex = cart.items.findIndex((item: any) => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }
    
    cart.items.splice(itemIndex, 1);
    
    const cartWithTotals = calculateCartTotals(cart);
    mockCarts[cartId] = cartWithTotals;
    
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to remove cart item'
    });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', (req, res) => {
  try {
    const cartId = getCartId(req);
    
    // Reset cart
    mockCarts[cartId] = {
      id: cartId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      data: mockCarts[cartId],
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

export default router;
