import { Router } from 'express';
import { getPool } from '../services/drizzle';

const router = Router();

// GET /api/health - Health check
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    const dbConnected = !!client;
    client.release();
    
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
        error: 'Internal server error'
      }
    });
  }
});

export default router;
