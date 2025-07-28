import { NextResponse } from 'next/server';
import { getSerpApiAccountInfo } from '@/lib/keyword-expansion/serpapi-service';

export async function GET() {
  try {
    const accountInfo = await getSerpApiAccountInfo();
    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch SERP API account information' },
        { status: 500 }
      );
    }
    return NextResponse.json(accountInfo);
  } catch (error) {
    console.error('SERP API account error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SERP API account information' },
      { status: 500 }
    );
  }
}
