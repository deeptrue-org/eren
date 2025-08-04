import { NextRequest, NextResponse } from 'next/server';
import { getProgress, updateProgress } from '@/lib/progress-store';
import { fetchTrendsData } from '@/lib/keyword-expansion/trends-fetcher';
import { processKeywordsData } from '@/lib/keyword-expansion/processor';
import { KeywordIdea, countryToLang } from '@/lib/keyword-expansion/types';
import {
  getGoogleTrendsFromSerpApi,
  TimeRange,
} from '@/lib/keyword-expansion/serpapi-service';

const expansionLock = new Set<string>();

async function processKeywordExpansion(sessionId: string, body: any) {
  expansionLock.add(sessionId);

  const {
    seedKeywords,
    countries = ['WW'],
    selectedApis = ['trends'],
    useSerpApi = false, // Enable SERP API keyword expansion
    timeRange = 'today 3-m', // Time range for trends and SERP API data
    browserInfo,
  } = body;

  console.log(`[${sessionId}] 📥 Received request:`, {
    seedKeywords,
    seedKeywordsLength: seedKeywords?.length || 0,
    countries,
    selectedApis,
    useSerpApi,
    timeRange,
    hasBrowserInfo: !!browserInfo,
  });

  await updateProgress(sessionId, {
    totalKeywords: seedKeywords.length * countries.length,
    currentKeywordIndex: 0,
    collectedKeywords: 0,
    isCompleted: false,
    logs: ['🚀 Expansion process started...'],
    results: {},
  });

  // We don't need to manage the driver here anymore,
  // fetchTrendsData will handle its lifecycle per call.

  try {
    const allIdeas: { [lang: string]: KeywordIdea[] } = {};
    const checkIsStopped = async () =>
      (await getProgress(sessionId))?.isCompleted || false;

    for (const country of countries) {
      if (await checkIsStopped()) break;
      const lang = countryToLang[country] || 'en';
      const langIdeas: KeywordIdea[] = [];

      await updateProgress(sessionId, {
        currentSource: `Processing language ${lang}`,
        logs: [`🌐 Expanding keywords for ${country} country...`],
      });

      if (await checkIsStopped()) break;

      // Fetch Google Trends data for all keywords in a single batch call
      if (selectedApis.includes('trends')) {
        await updateProgress(sessionId, {
          currentSource: `Fetching Google Trends data...`,
        });
        try {
          console.log(
            `[${sessionId}] Fetching trends data for seeds:`,
            seedKeywords,
            `countries: ${countries.join(', ')}, timeRange: ${timeRange}`
          );
          const trendsResults = await fetchTrendsData(
            seedKeywords,
            sessionId,
            false, // forceRefetch
            countries,
            timeRange
          );
          console.log(`[${sessionId}] Trends results received:`, trendsResults);

          for (const seed of seedKeywords) {
            if (await checkIsStopped()) break;
            const trendsData = trendsResults[seed];
            console.log(
              `[${sessionId}] Processing seed "${seed}", trends data:`,
              trendsData
            );

            // 🔥 FIXED: Always create/update idea for seed keywords, even without trends data
            let idea = langIdeas.find((i) => i.keyword === seed);
            if (idea) {
              console.log(
                `[${sessionId}] Updating existing idea for "${seed}"`
              );
              if (trendsData) {
                Object.assign(idea, trendsData);
              }
            } else {
              console.log(`[${sessionId}] Creating new idea for "${seed}"`);
              idea = {
                keyword: seed,
                source: 'seed',
                volume: 0,
                lang,
                selected: true,
                ...(trendsData || {}), // Apply trends data if available
              };
              langIdeas.push(idea);
            }
            console.log(`[${sessionId}] Final idea for "${seed}":`, idea);

            if (trendsData) {
              // Add related keywords
              if (trendsData.relatedQueries) {
                const topQueries = (trendsData.relatedQueries.top ?? []).map(
                  (q) =>
                    ({
                      keyword: q.query,
                      source: 'related',
                      volume: q.value,
                      lang,
                      selected: false,
                    } as KeywordIdea)
                );
                const risingQueries = (
                  trendsData.relatedQueries.rising ?? []
                ).map(
                  (q) =>
                    ({
                      keyword: q.query,
                      source: 'related',
                      volume: null,
                      lang,
                      selected: false,
                    } as KeywordIdea)
                );
                langIdeas.push(...topQueries, ...risingQueries);
              }
              if (trendsData.relatedTopics) {
                const topTopics = (trendsData.relatedTopics.top ?? []).map(
                  (t) =>
                    ({
                      keyword: t.topic,
                      source: 'related',
                      volume: t.value,
                      lang,
                      selected: false,
                    } as KeywordIdea)
                );
                const risingTopics = (
                  trendsData.relatedTopics.rising ?? []
                ).map(
                  (t) =>
                    ({
                      keyword: t.topic,
                      source: 'related',
                      volume: null,
                      lang,
                      selected: false,
                    } as KeywordIdea)
                );
                langIdeas.push(...topTopics, ...risingTopics);
              }
            } else {
              console.log(`[${sessionId}] No trends data found for "${seed}"`);
            }
          }

          // 🔥 NEW: Provide only valid seed keywords with trends data as intermediateResults
          const seedKeywordsForUI = langIdeas
            .filter((idea) => seedKeywords.includes(idea.keyword))
            .map((idea) => ({
              keyword: idea.keyword,
              lang: idea.lang,
              source: 'seed' as const,
              volume: idea.volume || null,
              interestOverTime: idea.interestOverTime,
              interestByRegion: idea.interestByRegion,
              relatedQueries: idea.relatedQueries,
              relatedTopics: idea.relatedTopics,
              isFetching: false,
              error: undefined,
            }))
            .filter((seed) => {
              const hasInterestOverTime =
                seed.interestOverTime && seed.interestOverTime.length > 0;
              const hasRelatedQueries =
                seed.relatedQueries &&
                ((seed.relatedQueries.top &&
                  seed.relatedQueries.top.length > 0) ||
                  (seed.relatedQueries.rising &&
                    seed.relatedQueries.rising.length > 0));
              const hasRelatedTopics =
                seed.relatedTopics &&
                ((seed.relatedTopics.top &&
                  seed.relatedTopics.top.length > 0) ||
                  (seed.relatedTopics.rising &&
                    seed.relatedTopics.rising.length > 0));
              const hasInterestByRegion =
                seed.interestByRegion && seed.interestByRegion.length > 0;

              return (
                hasInterestOverTime ||
                hasRelatedQueries ||
                hasRelatedTopics ||
                hasInterestByRegion
              );
            });

          console.log(
            `[${sessionId}] Sending ${seedKeywordsForUI.length} valid seed keywords to UI (with trends data)`
          );

          await updateProgress(sessionId, {
            logs: [`📊 Processed trend data for all keywords.`],
            results: { ...allIdeas, [lang]: langIdeas },
            intermediateResults: { [lang]: seedKeywordsForUI },
          });
          console.log(
            `[${sessionId}] ✅ Sent intermediateResults to progress store for lang ${lang}`
          );
          console.log(
            `[${sessionId}] intermediateResults structure:`,
            JSON.stringify({ [lang]: seedKeywordsForUI }, null, 2)
          );
        } catch (trendsError: any) {
          console.warn(
            `[${sessionId}] Bulk trends extraction failed.`,
            trendsError
          );
          await updateProgress(sessionId, {
            logs: [`❌ Failed to get bulk Trends data.`],
          });
        }
      }

      // Fetch SERP API data if enabled
      if (selectedApis.includes('serpapi') && useSerpApi) {
        await updateProgress(sessionId, {
          currentSource: `Fetching SERP API data...`,
          logs: [`🔍 Expanding keywords via SERP API for ${country}...`],
        });

        try {
          console.log(
            `[${sessionId}] Fetching SERP API data for seeds:`,
            seedKeywords,
            `country: ${country}, timeRange: ${timeRange}`
          );

          for (const seed of seedKeywords) {
            if (await checkIsStopped()) break;

            await updateProgress(sessionId, {
              currentSource: `SERP API: ${seed}`,
              logs: [
                `🔍 Getting related keywords for "${seed}" via SERP API...`,
              ],
            });

            // 🔥 FIXED: Always ensure seed keyword is included in results
            let seedIdea = langIdeas.find((i) => i.keyword === seed);
            if (!seedIdea) {
              console.log(`[${sessionId}] Creating seed idea for "${seed}"`);
              seedIdea = {
                keyword: seed,
                source: 'seed',
                volume: 0,
                lang,
                selected: true,
              };
              langIdeas.push(seedIdea);
            }

            try {
              const serpApiResults = await getGoogleTrendsFromSerpApi(
                seed,
                lang,
                country === 'WW' ? 'US' : country, // Use US for worldwide, else use country code
                timeRange as TimeRange
              );

              console.log(
                `[${sessionId}] SERP API results for "${seed}":`,
                serpApiResults
              );

              // 🔥 FIXED: Apply complete trends data to seed keyword
              if (serpApiResults.seedKeywordData) {
                console.log(
                  `[${sessionId}] Applying SERP API trends data to seed keyword "${seed}"`
                );
                // Update the existing seed idea with complete trends data
                Object.assign(seedIdea, serpApiResults.seedKeywordData);

                console.log(
                  `[${sessionId}] ✅ Seed keyword "${seed}" enriched with SERP API data:`,
                  {
                    hasInterestOverTime: !!seedIdea.interestOverTime?.length,
                    hasInterestByRegion: !!seedIdea.interestByRegion?.length,
                    hasRelatedQueries: !!(
                      seedIdea.relatedQueries?.top?.length ||
                      seedIdea.relatedQueries?.rising?.length
                    ),
                    hasRelatedTopics: !!(
                      seedIdea.relatedTopics?.top?.length ||
                      seedIdea.relatedTopics?.rising?.length
                    ),
                    timeRange: seedIdea.timeRange,
                    geo: seedIdea.geo,
                  }
                );
              }

              // Add SERP API related keywords to langIdeas
              langIdeas.push(...serpApiResults.relatedKeywords);

              // Count how many related keywords have trends data
              const relatedWithTrends = serpApiResults.relatedKeywords.filter(
                (kw) => kw.interestOverTime && kw.interestOverTime.length > 0
              );

              await updateProgress(sessionId, {
                logs: [
                  `✅ Found ${serpApiResults.relatedKeywords.length} related keywords for "${seed}" via SERP API`,
                  `📊 Applied complete trends data to seed keyword "${seed}"`,
                  `🎯 ${relatedWithTrends.length}/${serpApiResults.relatedKeywords.length} related keywords include trends data`,
                ],
              });

              // 🔥 NEW: Send enriched seed keyword and related keywords with trends data to UI immediately
              const enrichedSeedForUI = {
                keyword: seedIdea.keyword,
                lang: seedIdea.lang,
                source: 'seed' as const,
                volume: seedIdea.volume || null,
                interestOverTime: seedIdea.interestOverTime,
                interestByRegion: seedIdea.interestByRegion,
                relatedQueries: seedIdea.relatedQueries,
                relatedTopics: seedIdea.relatedTopics,
                timeRange: seedIdea.timeRange,
                geo: seedIdea.geo,
                isFetching: false,
                error: undefined,
              };

              // Include related keywords that have trends data
              const enrichedRelatedForUI = relatedWithTrends.map((kw) => ({
                keyword: kw.keyword,
                lang: kw.lang,
                source: kw.source,
                volume: kw.volume || null,
                interestOverTime: kw.interestOverTime,
                interestByRegion: kw.interestByRegion,
                relatedQueries: kw.relatedQueries,
                relatedTopics: kw.relatedTopics,
                timeRange: kw.timeRange,
                geo: kw.geo,
                isFetching: false,
                error: undefined,
              }));

              const allEnrichedKeywords = [
                enrichedSeedForUI,
                ...enrichedRelatedForUI,
              ];

              await updateProgress(sessionId, {
                intermediateResults: { [lang]: allEnrichedKeywords },
                logs: [
                  `🎯 Sent enriched seed keyword "${seed}" and ${relatedWithTrends.length} related keywords to UI with trends data`,
                ],
              });
            } catch (serpError) {
              console.error(
                `[${sessionId}] SERP API error for "${seed}":`,
                serpError
              );
              await updateProgress(sessionId, {
                logs: [
                  `❌ SERP API error for "${seed}": ${serpError}. Seed keyword still included.`,
                ],
              });
            }

            console.log(`[${sessionId}] Seed "${seed}" ensured in results`);
          }
        } catch (error) {
          console.error(`[${sessionId}] SERP API error:`, error);
          await updateProgress(sessionId, {
            currentSource: `Failed to fetch SERP API data`,
            logs: [`❌ Error fetching SERP API data: ${error}`],
          });
        }
      }

      allIdeas[lang] = langIdeas;
    }

    if (await checkIsStopped()) return;

    // 🔥 NEW: Ensure seed keywords with trends data are provided for UI
    const seedKeywordsWithData: { [lang: string]: any[] } = {};
    for (const lang in allIdeas) {
      const langKeywords = allIdeas[lang] || [];
      seedKeywordsWithData[lang] = langKeywords
        .filter((idea) => seedKeywords.includes(idea.keyword))
        .map((idea) => ({
          keyword: idea.keyword,
          lang: idea.lang,
          source: 'seed' as const,
          volume: idea.volume || null,
          interestOverTime: idea.interestOverTime,
          interestByRegion: idea.interestByRegion,
          relatedQueries: idea.relatedQueries,
          relatedTopics: idea.relatedTopics,
          isFetching: false,
          error: undefined,
        }));

      console.log(
        `[${sessionId}] Final seed keywords for lang ${lang}:`,
        JSON.stringify(seedKeywordsWithData[lang], null, 2)
      );
    }

    // Process related keywords (excluding seeds)
    const processedResults = processKeywordsData(allIdeas, seedKeywords);

    // 🔥 FIXED: Add only seed keywords with meaningful trends data to results
    const finalResults: { [lang: string]: any[] } = {};
    for (const lang in processedResults) {
      const seedsForLang = seedKeywordsWithData[lang] || [];
      const relatedForLang = processedResults[lang] || [];

      // Only include seeds that have meaningful trends data
      const validSeeds = seedsForLang.filter((seed) => {
        const hasInterestOverTime =
          seed.interestOverTime && seed.interestOverTime.length > 0;
        const hasRelatedQueries =
          seed.relatedQueries &&
          ((seed.relatedQueries.top && seed.relatedQueries.top.length > 0) ||
            (seed.relatedQueries.rising &&
              seed.relatedQueries.rising.length > 0));
        const hasRelatedTopics =
          seed.relatedTopics &&
          ((seed.relatedTopics.top && seed.relatedTopics.top.length > 0) ||
            (seed.relatedTopics.rising &&
              seed.relatedTopics.rising.length > 0));
        const hasInterestByRegion =
          seed.interestByRegion && seed.interestByRegion.length > 0;

        return (
          hasInterestOverTime ||
          hasRelatedQueries ||
          hasRelatedTopics ||
          hasInterestByRegion
        );
      });

      finalResults[lang] = [
        ...validSeeds, // Add only seeds with actual trends data
        ...relatedForLang, // Then add related keywords
      ];

      console.log(
        `[${sessionId}] 🎯 For lang ${lang}: ${validSeeds.length} valid seeds (out of ${seedsForLang.length}), ${relatedForLang.length} related`
      );
    }

    console.log(
      `[${sessionId}] 🎯 Final results including seed keywords:`,
      JSON.stringify(finalResults, null, 2)
    );

    await updateProgress(sessionId, {
      isCompleted: true,
      results: finalResults, // Include both seed and related keywords
      intermediateResults: finalResults, // Use same filtered results to avoid duplicates
      logs: ['✅ Keyword expansion completed successfully.'],
    });
  } catch (error: any) {
    console.error(`[${sessionId}] Expansion failed:`, error);
    await updateProgress(sessionId, {
      error: error.message || 'Unknown error',
      isCompleted: true,
      logs: [
        '❌ Expansion failed',
        `🔍 Error: ${error.message || 'Unknown error'}`,
      ],
    });
  } finally {
    expansionLock.delete(sessionId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seedKeywords } = body;

    if (
      !seedKeywords ||
      !Array.isArray(seedKeywords) ||
      seedKeywords.length === 0
    ) {
      return NextResponse.json(
        { error: 'Seed keywords are required.' },
        { status: 400 }
      );
    }

    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    processKeywordExpansion(newSessionId, body);
    return NextResponse.json({ sessionId: newSessionId }, { status: 202 });
  } catch (error: any) {
    console.error('Error in POST /api/keywords/expand:', error);
    return NextResponse.json(
      { error: 'Failed to process request.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }
  const progress = await getProgress(sessionId);
  if (!progress) {
    return NextResponse.json(
      { error: 'Progress not found for session' },
      { status: 404 }
    );
  }
  return NextResponse.json(progress);
}

export async function PATCH(req: NextRequest) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  console.log(
    `[${sessionId}] Received PATCH request to confirm CAPTCHA solved.`
  );

  try {
    const progress = await getProgress(sessionId);
    if (progress) {
      await updateProgress(sessionId, {
        waitingForUserIntervention: false,
        captchaDetected: false, // Reset captcha state
      });
    }
    return NextResponse.json({ message: 'Confirmed, resuming...' });
  } catch (error) {
    console.error('Error confirming CAPTCHA:', error);
    return NextResponse.json(
      { error: 'Failed to confirm CAPTCHA' },
      { status: 500 }
    );
  }
}
