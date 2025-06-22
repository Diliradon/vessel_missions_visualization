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

    const ppReferences = await prisma.ppReference.findMany();

    return NextResponse.json(ppReferences);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching PP references:', error);

    return NextResponse.json(
      { error: 'Failed to fetch PP references' },
      { status: 500 },
    );
  }
};
