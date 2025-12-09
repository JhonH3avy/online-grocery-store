// Legacy database helpers replaced by Drizzle/pg usage. Keeping minimal stubs to avoid breaking imports.
import { getPool } from './drizzle';

export const query = async (text: string, params?: any[]): Promise<any> => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows };
  } finally {
    client.release();
  }
};

export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await callback(client);
    await client.query('COMMIT');
    return res;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  const pool = getPool();
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  const pool = getPool();
  await pool.end();
};

export default { query, transaction, checkDatabaseConnection, closeDatabaseConnection };
