import { getGscKeywords } from '@/lib/services/gsc-service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const periodUnit = searchParams.get('periodUnit') as any;
  const periodValue = searchParams.get('periodValue');
  const country = searchParams.get('country') || undefined;

  if (!url) {
    return NextResponse.json(
      { error: 'Website URL is required' },
      { status: 400 }
    );
  }

  try {
    const keywords = await getGscKeywords(
      url,
      periodUnit,
      periodValue ? parseInt(periodValue, 10) : 1,
      country
    );
    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Error in GSC API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GSC keywords' },
      { status: 500 }
    );
  }
}
