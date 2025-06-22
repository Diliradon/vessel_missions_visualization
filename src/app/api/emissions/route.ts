import { NextResponse } from 'next/server';

import { prisma } from '@/shared/lib/prisma';

export const GET = async () => {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 },
      );
    }

    const emissions = await prisma.dailyLogEmissions.findMany({
      orderBy: {
        TOUTC: 'desc',
      },
    });

    // Convert BigInt LOGID to string for JSON serialization
    const serializedEmissions = emissions.map(emission => ({
      ...emission,
      LOGID: emission.LOGID.toString(),
    }));

    return NextResponse.json(serializedEmissions);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching emissions:', error);

    return NextResponse.json(
      { error: 'Failed to fetch emissions' },
      { status: 500 },
    );
  }
};
