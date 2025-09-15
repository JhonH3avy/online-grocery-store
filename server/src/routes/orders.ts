import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/prisma';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
  deliveryAddressId: z.string().uuid('Invalid delivery address ID'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
});

// Helper function to calculate order totals
const calculateOrderTotals = (items: Array<{ price: number; quantity: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 50 ? 0 : 5.99; // Free delivery over $50
  const total = subtotal + deliveryFee;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// POST /api/orders - Create new order (checkout) - REQUIRES AUTHENTICATION
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate input
    const validatedData = createOrderSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify delivery address belongs to user
    const deliveryAddress = await prisma.address.findFirst({
      where: {
        id: validatedData.deliveryAddressId,
        userId: userId,
      }
    });

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery address',
      });
    }

    // Get product details and verify availability
    const productIds = validatedData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        inventory: true,
      }
    });

    if (products.length !== validatedData.items.length) {
      return res.status(400).json({
        success: false,
        error: 'Some products are not available',
      });
    }

    // Check inventory and prepare order items
    const orderItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];
    const itemsWithPrices = [];

    for (const orderItem of validatedData.items) {
      const product = products.find(p => p.id === orderItem.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${orderItem.productId} not found`,
        });
      }

      // Check inventory
      if (product.inventory && product.inventory.quantity < orderItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}`,
        });
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * orderItem.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: orderItem.quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
      });

      itemsWithPrices.push({
        price: unitPrice,
        quantity: orderItem.quantity,
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(itemsWithPrices);

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: userId,
          deliveryAddressId: validatedData.deliveryAddressId,
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          paymentMethod: validatedData.paymentMethod,
          notes: validatedData.notes || null,
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
        include: {
          deliveryAddress: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({
          orderId: newOrder.id,
          ...item,
        }))
      });

      // Update inventory
      for (const orderItem of validatedData.items) {
        await tx.inventory.updateMany({
          where: { productId: orderItem.productId },
          data: {
            quantity: { decrement: orderItem.quantity },
            lastUpdated: new Date(),
          }
        });
      }

      // Clear user's cart after successful order
      await tx.cartItem.deleteMany({
        where: { userId: userId }
      });

      return newOrder;
    });

    // Get the complete order with items
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                unit: true,
              }
            }
          }
        },
        deliveryAddress: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: completeOrder,
      message: 'Order created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Order creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
});

// GET /api/orders - Get user's order history - REQUIRES AUTHENTICATION
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 per page
    const status = req.query.status as string;

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // Get total count
    const totalOrders = await prisma.order.count({ where });

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                unit: true,
              }
            }
          }
        },
        deliveryAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return res.json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
        hasMore: page * limit < totalOrders,
      },
      message: 'Orders retrieved successfully',
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
    });
  }
});

// GET /api/orders/:id - Get specific order details - REQUIRES AUTHENTICATION
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: id as string,
        userId, // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                unit: true,
                description: true,
              }
            }
          }
        },
        deliveryAddress: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      data: order,
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve order',
    });
  }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: id as string },
      data: {
        status: validatedData.status,
        ...(validatedData.status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                unit: true,
              }
            }
          }
        },
        deliveryAddress: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    return res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
});

export default router;
