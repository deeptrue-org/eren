import { NextResponse } from 'next/server';
import { notionService } from '../../../../lib/services/notion-service';

// --- Helper: Get Keywords from Notion URL ---
async function getKeywordsFromNotionUrl(url?: string) {
  try {
    // If no URL provided, will use default service info page
    return await notionService.getKeywordsFromPage(url);
  } catch (error) {
    console.error(`Error fetching Notion page ${url || 'default'}:`, error);
    return [];
  }
}

export async function POST(request: Request) {
  const { notionUrl, manualKeywords, excludeKeywords, useContainsExclusion } =
    await request.json();

  let collectedKeywords: { keyword: string; source: string }[] = [];

  // 1. Get keywords from Notion URL
  const notionKeywords = await getKeywordsFromNotionUrl(notionUrl);
  collectedKeywords.push(...notionKeywords);

  // 2. Add manual keywords
  if (manualKeywords) {
    const manualList = manualKeywords
      .split('\n')
      .map((k: string) => k.trim())
      .filter(Boolean)
      .map((k: string) => ({ keyword: k, source: 'Manual' }));
    collectedKeywords.push(...manualList);
  }

  // 3. Filter out excluded keywords
  if (excludeKeywords) {
    const excludeList = excludeKeywords
      .split('\n')
      .map((k: string) => k.trim().toLowerCase())
      .filter(Boolean);

    if (useContainsExclusion) {
      collectedKeywords = collectedKeywords.filter((k) => {
        const lowerKeyword = k.keyword.toLowerCase();
        return !excludeList.some((ex: string) => lowerKeyword.includes(ex));
      });
    } else {
      collectedKeywords = collectedKeywords.filter(
        (k) => !excludeList.includes(k.keyword.toLowerCase())
      );
    }
  }

  // 4. Remove duplicates
  const uniqueKeywords = collectedKeywords.filter(
    (value, index, self) =>
      value.keyword &&
      index === self.findIndex((t) => t.keyword === value.keyword)
  );

  return NextResponse.json(uniqueKeywords);
}
