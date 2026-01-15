// src/app/api/trends/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchTrendsData } from '@/lib/keyword-expansion/trends-fetcher';
import { stopDriver } from '@/lib/keyword-expansion/driver-manager';

export async function POST(req: NextRequest) {
  const { keywords, sessionId, forceRefetch = false } = await req.json();

  if (
    !keywords ||
    !Array.isArray(keywords) ||
    keywords.length === 0 ||
    !sessionId
  ) {
    return NextResponse.json(
      { error: 'keywords (array) and sessionId are required' },
      { status: 400 }
    );
  }

  try {
    console.log(
      `[API] Received request to fetch trends for keywords: "${keywords.join(
        ', '
      )}" with session ID: ${sessionId}`
    );
    // fetchTrendsData returns an object with keyword as key, so we need to extract the data
    const allTrendsData = await fetchTrendsData(
      keywords,
      sessionId,
      forceRefetch
    );

    // Extract data for the first keyword (since hook sends only one)
    const keyword = keywords[0];
    const trendsData = allTrendsData[keyword] || {};

    console.log(`[API] Returning trends data for "${keyword}":`, trendsData);
    return NextResponse.json(trendsData);
  } catch (error: any) {
    console.error(
      `[API] Error fetching trends data for session ${sessionId}:`,
      error
    );
    // Ensure the driver is stopped in case of an error to prevent dangling processes
    await stopDriver(sessionId);

    return NextResponse.json(
      {
        error: 'Failed to fetch trends data.',
        details: error.message || 'An unknown error occurred.',
      },
      { status: 500 }
    );
  }
}
