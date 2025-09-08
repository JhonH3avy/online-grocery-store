import { Router } from 'express';

const router = Router();

// Mock orders storage (in production, this would be in database)
const mockOrders: Record<string, any> = {};
let orderIdCounter = 1;

// Helper function to get user ID (in production, this would be based on JWT token)
const getUserId = (req: any) => {
  // For now, use a default user ID. In production, extract from JWT token
  return req.headers['x-user-id'] || 'default-user';
};

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Helper function to calculate order totals
const calculateOrderTotals = (items: any[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10; // 10% tax
  const deliveryFee = subtotal >= 50 ? 0 : 5.99; // Free delivery over $50
  const total = subtotal + tax + deliveryFee;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// POST /api/orders - Create new order (checkout)
router.post('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const { 
      items, 
      deliveryAddress, 
      paymentMethod, 
      deliveryNotes,
      deliveryTimeSlot 
    } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order items are required'
      });
    }
    
    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Delivery address is required'
      });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required'
      });
    }
    
    // Calculate totals
    const totals = calculateOrderTotals(items);
    
    // Create new order
    const orderId = `order-${orderIdCounter++}`;
    const orderNumber = generateOrderNumber();
    const newOrder = {
      id: orderId,
      orderNumber,
      userId,
      status: 'pending',
      items: items.map((item: any) => ({
        id: item.id || `${orderId}-${item.productId}`,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit || 'kg',
        imageUrl: item.imageUrl || ''
      })),
      ...totals,
      deliveryAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        country: deliveryAddress.country || 'USA'
      },
      paymentMethod: {
        type: paymentMethod.type, // 'card', 'paypal', 'cash'
        lastFour: paymentMethod.lastFour || null
      },
      deliveryNotes: deliveryNotes || '',
      deliveryTimeSlot: deliveryTimeSlot || 'standard',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockOrders[orderId] = newOrder;
    
    return res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// GET /api/orders - Get user's order history
router.get('/', (req, res) => {
  try {
    const userId = getUserId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    
    // Filter orders by user
    const userOrders = Object.values(mockOrders).filter((order: any) => order.userId === userId);
    
    // Filter by status if provided
    const filteredOrders = status 
      ? userOrders.filter((order: any) => order.status === status)
      : userOrders;
    
    // Sort by creation date (most recent first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return res.status(200).json({
      success: true,
      data: paginatedOrders,
      pagination: {
        total: filteredOrders.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOrders.length / limit),
        hasMore: endIndex < filteredOrders.length
      },
      message: 'Orders retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders'
    });
  }
});

// GET /api/orders/:id - Get specific order details
router.get('/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const order = mockOrders[id];
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order belongs to the user
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve order'
    });
  }
});

// PUT /api/orders/:id/status - Update order status (admin)
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }
    
    const order = mockOrders[id];
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update order status
    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

export default router;
