import { PrismaClient } from '@/generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    //   log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    transactionOptions: {
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper function to handle database errors
export function handlePrismaError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof Error) {
    // Prisma specific errors
    if ('code' in error) {
      const prismaError = error as any;
      switch (prismaError.code) {
        case 'P2002':
          return {
            message: 'A record with this value already exists.',
            code: 'DUPLICATE',
          };
        case 'P2025':
          return { message: 'Record not found.', code: 'NOT_FOUND' };
        case 'P2003':
          return { message: 'Invalid reference.', code: 'INVALID_REFERENCE' };
        case 'P2021':
          return { message: 'Table does not exist.', code: 'TABLE_NOT_FOUND' };
        default:
          return { message: prismaError.message, code: prismaError.code };
      }
    }
    return { message: error.message };
  }
  return { message: 'An unknown error occurred' };
}
