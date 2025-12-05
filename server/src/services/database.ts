// Compatibility layer for legacy code - wraps Prisma
import { prisma } from './prisma';
import type { PrismaClient } from '../prisma/client';

// Helper function for queries
export const query = async (text: string, params?: any[]): Promise<any> => {
  // If the provided SQL contains multiple statements, split and execute them
  // individually. Some Postgres drivers disallow sending multiple statements
  // in a single prepared statement, which causes the "cannot insert multiple
  // commands into a prepared statement" error. Splitting avoids that.
  const statements = text
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  if (statements.length > 1) {
    let lastResult: any;
    for (const stmt of statements) {
      // Use executeRawUnsafe for statements that don't return rows
      lastResult = await prisma.$executeRawUnsafe(stmt);
    }
    return { rows: [] };
  }

  const result = params && params.length
    ? await prisma.$queryRawUnsafe(text, ...(params || []))
    : await prisma.$queryRawUnsafe(text);

  return { rows: Array.isArray(result) ? result : [result] };
};

// Helper function for transactions
export const transaction = async (callback: (client: PrismaClient) => Promise<any>): Promise<any> => {
  return prisma.$transaction(async (tx: any) => {
    return await callback(tx as PrismaClient);
  });
};

// Health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default { query, transaction, checkDatabaseConnection, closeDatabaseConnection };
