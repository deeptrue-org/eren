// src/app/api/keywords/serpapi-full/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSerpApiFullData } from '@/lib/keyword-expansion/serpapi-service';

export async function POST(req: NextRequest) {
  try {
    const {
      keyword,
      lang = 'en',
      geo = 'WW',
      timeRange = 'today 3-m',
    } = await req.json();

    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching full SERP API data for keyword: "${keyword}"`);

    const fullData = await getSerpApiFullData(keyword, lang, geo, timeRange);

    if (!fullData) {
      return NextResponse.json(
        { error: 'Failed to fetch SERP API data' },
        { status: 500 }
      );
    }

    console.log(
      `[API] Successfully returned full SERP API data for "${keyword}"`
    );
    return NextResponse.json(fullData);
  } catch (error: any) {
    console.error('[API] Error fetching full SERP API data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch full SERP API data.',
        details: error.message || 'An unknown error occurred.',
      },
      { status: 500 }
    );
  }
}
