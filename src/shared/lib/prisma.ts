import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client only if MONGODB_URI is available
const createPrismaClient = () => {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    // eslint-disable-next-line no-console
    console.warn(
      'MONGODB_URI environment variable is not set. Prisma client will not be initialized.',
    );

    return null;
  }

  return new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: mongodbUri,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
