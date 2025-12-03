// Compatibility layer for legacy code - wraps Prisma
import { prisma } from './prisma';
import type { PrismaClient } from '@prisma/client';

// Helper function for queries
export const query = async (text: string, params?: any[]): Promise<any> => {
  const result = await prisma.$queryRawUnsafe(text, ...(params || []));
  return { rows: Array.isArray(result) ? result : [result] };
};

// Helper function for transactions
export const transaction = async (callback: (client: PrismaClient) => Promise<any>): Promise<any> => {
  return prisma.$transaction(async (tx) => {
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
