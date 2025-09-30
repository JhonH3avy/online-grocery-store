import { Router } from 'express';
import { checkDatabaseConnection } from '../services/prisma';

const router = Router();

// GET /api/health - Health check
router.get('/', async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbConnected,
        status: dbConnected ? 'healthy' : 'disconnected'
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
