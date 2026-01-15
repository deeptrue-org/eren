import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getGscKeywords } from '@/lib/services/gsc-service'; // Import the centralized service

// --- Helper: Get Keywords from URL ---
async function getKeywordsFromUrl(url: string) {
  if (!url) return [];
  try {
    const fullUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    const response = await fetch(fullUrl);
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);

    // To avoid including code in keywords, remove script, style, pre, and code tags
    $('script, style, pre, code, svg').remove();

    const pageText = $('body').text();

    // A more robust regex to extract "words" which are sequences of letters (in any language) and numbers.
    // This will effectively ignore punctuation and special symbols, splitting text into meaningful chunks.
    const words = pageText.toLowerCase().match(/[a-zA-Z0-9]+/g) || [];

    const filteredWords = words.filter((w) => {
      // Filter for words longer than 3 chars and that are not just numbers
      return w.length > 3 && !/^\d+$/.test(w);
    });

    // Get unique keywords
    const uniqueWords = [...new Set(filteredWords)];

    return uniqueWords.map((k) => ({ keyword: k, source: 'URL' as const }));
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
    return [];
  }
}

export async function POST(request: Request) {
  const {
    websiteUrl,
    notionUrl,
    manualKeywords,
    excludeKeywords,
    useContainsExclusion,
    gscPeriodUnit,
    gscPeriodValue,
    gscCountry,
  } = await request.json();

  let collectedKeywords: { keyword: string; source: string }[] = [];

  // 1. Get keywords from URLs
  const urlKeywords = await getKeywordsFromUrl(websiteUrl);
  const notionKeywords = await getKeywordsFromUrl(notionUrl);
  collectedKeywords.push(...urlKeywords, ...notionKeywords);

  // Get keywords from GSC. If it fails, it will return an empty array.
  if (websiteUrl) {
    const countryForGsc = gscCountry === 'all' ? undefined : gscCountry;
    const gscKeywordsData = await getGscKeywords(
      websiteUrl,
      gscPeriodUnit,
      gscPeriodValue,
      countryForGsc
    ); // Using centralized service
    collectedKeywords.push(...gscKeywordsData);
  }

  // 3. Add manual keywords
  if (manualKeywords) {
    const manualList = manualKeywords
      .split('\n')
      .map((k: string) => k.trim())
      .filter(Boolean)
      .map((k: string) => ({ keyword: k, source: 'Manual' }));
    collectedKeywords.push(...manualList);
  }

  // 4. Filter out excluded keywords
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

  // 5. Remove duplicates
  const uniqueKeywords = collectedKeywords.filter(
    (value, index, self) =>
      value.keyword &&
      index === self.findIndex((t) => t.keyword === value.keyword)
  );

  return NextResponse.json(uniqueKeywords);
}
