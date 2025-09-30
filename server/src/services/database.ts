import { Pool, PoolClient } from 'pg';

// Function to determine SSL configuration
const getSSLConfig = () => {
  const databaseUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log('🔗 Database connection configuration:');
  console.log(`- Environment: ${nodeEnv}`);
  console.log(`- Database URL configured: ${databaseUrl ? 'true' : 'false'}`);
  
  // If DATABASE_URL explicitly includes sslmode parameter, respect it
  if (databaseUrl.includes('sslmode=')) {
    if (databaseUrl.includes('sslmode=disable')) {
      console.log('- SSL mode: disabled (explicit)');
      return false;
    } else if (databaseUrl.includes('sslmode=require')) {
      console.log('- SSL mode: required (explicit)');
      return { rejectUnauthorized: false };
    } else if (databaseUrl.includes('sslmode=verify-ca')) {
      console.log('- SSL mode: verify-ca (explicit)');
      return { rejectUnauthorized: true };
    } else if (databaseUrl.includes('sslmode=verify-full')) {
      console.log('- SSL mode: verify-full (explicit)');
      return { rejectUnauthorized: true };
    }
  }
  
  // For local development (localhost or 127.0.0.1), disable SSL
  if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    console.log('- SSL enabled: false (localhost detected)');
    return false;
  }
  
  // Azure PostgreSQL always requires SSL
  if (databaseUrl.includes('azure.com') || databaseUrl.includes('postgres.database.azure.com')) {
    console.log('- SSL enabled: true (Azure PostgreSQL detected)');
    console.log('- ⚠️  Note: Azure requires SSL. Add ?sslmode=require to your DATABASE_URL for explicit configuration');
    return { rejectUnauthorized: false };
  }
  
  // Other cloud providers that typically require SSL
  if (databaseUrl.includes('amazonaws.com') || databaseUrl.includes('heroku.com') || 
      databaseUrl.includes('digitalocean.com') || databaseUrl.includes('supabase.com')) {
    console.log('- SSL enabled: true (cloud provider detected)');
    return { rejectUnauthorized: false };
  }
  
  // For production or cloud databases, enable SSL but don't reject unauthorized
  if (nodeEnv === 'production') {
    console.log('- SSL enabled: true (production environment)');
    return { rejectUnauthorized: false };
  }
  
  // Default to no SSL for development
  console.log('- SSL enabled: false (development environment)');
  return false;
};

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSSLConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection configuration (without sensitive data)
console.log('🔗 Database connection configuration:');
console.log('- Environment:', process.env.NODE_ENV || 'development');
console.log('- SSL enabled:', getSSLConfig() !== false);
console.log('- Database URL configured:', !!process.env.DATABASE_URL);

// Helper function for queries
export const query = async (text: string, params?: any[]): Promise<any> => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Helper function for transactions
export const transaction = async (callback: (client: PoolClient) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check with retry logic
export const checkDatabaseConnection = async (): Promise<boolean> => {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Database connection attempt ${attempt}/${maxRetries}`);
      await query('SELECT 1');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error);
      
      // If this is an SSL error and we're not on the last attempt, try without SSL
      if (attempt < maxRetries && error instanceof Error && error.message.includes('SSL')) {
        console.log('🔄 Retrying connection without SSL...');
        
        // Create a new pool without SSL for this retry
        const noSSLPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: false,
          max: 1,
          connectionTimeoutMillis: 5000,
        });
        
        try {
          const client = await noSSLPool.connect();
          await client.query('SELECT 1');
          client.release();
          await noSSLPool.end();
          
          console.log('✅ Database connection successful without SSL');
          
          // Recreate main pool without SSL
          await pool.end();
          const newPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          });
          
          // Replace the pool (this is a bit hacky but works)
          Object.setPrototypeOf(pool, newPool);
          Object.assign(pool, newPool);
          
          return true;
        } catch (noSSLError) {
          console.error('❌ Connection without SSL also failed:', noSSLError);
          await noSSLPool.end();
        }
      }
      
      if (attempt === maxRetries) {
        console.error('💥 All database connection attempts failed');
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  await pool.end();
};

export default { query, transaction, checkDatabaseConnection, closeDatabaseConnection };