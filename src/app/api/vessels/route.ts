import { NextResponse } from 'next/server';

import { prisma } from '@/shared/lib/prisma';

export const GET = async () => {
  // During build time, return empty array to prevent build failures
  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    return NextResponse.json([]);
  }

  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 },
      );
    }

    const vessels = await prisma.vessel.findMany();

    return NextResponse.json(vessels);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching vessels:', error);

    return NextResponse.json(
      { error: 'Failed to fetch vessels' },
      { status: 500 },
    );
  }
};
