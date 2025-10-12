import { NextResponse } from 'next/server';
import { ContentBrief } from '@/lib/types';
import { UnifiedContentService } from '@/lib/unified-content-service';
import { checkRateLimit } from '@/lib/outline-generation/utils';

// ============================================================================
// UTILITIES
// ============================================================================

const requestTracker = new Map<string, { count: number; resetTime: number }>();

// ============================================================================
// ARTICLE PROCESSING LOGIC
// ============================================================================

export interface ArticleResult {
  id: string;
  briefId: string;
  keyword: string;
  title: string;
  content: string;
  wordCount: number;
}

async function processBrief(
  brief: ContentBrief,
  sendLog?: (message: string) => void
): Promise<ArticleResult> {
  const unifiedService = new UnifiedContentService();
  const result = await unifiedService.generateArticle(brief, sendLog);

  return {
    id: `article-${brief.id}`,
    briefId: brief.id,
    keyword: brief.keyword,
    title: result.title,
    content: result.content,
    wordCount: result.wordCount,
  };
}

// ============================================================================
// MAIN HANDLER & WORKFLOW
// ============================================================================

export async function POST(req: Request) {
  try {
    const { selectedBriefs, stream } = await req.json();
    if (!Array.isArray(selectedBriefs) || selectedBriefs.length === 0) {
      return NextResponse.json(
        { error: 'Selected briefs are required.' },
        { status: 400 }
      );
    }

    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, requestTracker)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded.' },
        { status: 429 }
      );
    }

    // If streaming is requested, use SSE
    if (stream) {
      const encoder = new TextEncoder();

      const customReadable = new ReadableStream({
        start(controller) {
          const sendLog = (message: string) => {
            try {
              // Check if controller is still active and ready to receive data
              if (
                controller.desiredSize !== null &&
                controller.desiredSize !== 0
              ) {
                const data = `data: ${JSON.stringify({
                  type: 'log',
                  message,
                  timestamp: new Date().toISOString(),
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            } catch (error) {
              // Silently ignore controller errors to prevent spam in logs
              console.debug('Stream controller closed, skipping log:', message);
            }
          };

          const processWithLogs = async () => {
            try {
              sendLog(
                `🚀 Starting article generation for ${selectedBriefs.length} briefs.`
              );

              const results = await Promise.all(
                selectedBriefs.map((brief) =>
                  processBrief(brief, sendLog).catch((error) => {
                    const errorMessage = `❌ Error processing brief "${brief.topic}": ${error.message}`;
                    console.error(errorMessage);
                    sendLog(errorMessage);
                    // Return a fallback or error structure if a single brief fails
                    return {
                      id: `article-${brief.id}`,
                      briefId: brief.id,
                      keyword: brief.keyword,
                      title: `Failed to process: ${brief.topic}`,
                      content: `Error: ${error.message}\n\nFailed to generate content for ${brief.keyword}. Please try again.`,
                      wordCount: 0,
                    };
                  })
                )
              );

              sendLog(
                `🎉 Article generation complete: ${results.length} articles processed.`
              );

              // Send final results
              try {
                if (controller.desiredSize !== null) {
                  const finalData = `data: ${JSON.stringify({
                    type: 'complete',
                    results,
                    timestamp: new Date().toISOString(),
                  })}\n\n`;
                  controller.enqueue(encoder.encode(finalData));
                }
              } catch (error) {
                console.debug(
                  'Could not send final results, controller may be closed'
                );
              } finally {
                try {
                  controller.close();
                } catch (error) {
                  console.debug('Controller already closed');
                }
              }
            } catch (error: any) {
              sendLog(`❌ Error in article generation: ${error.message}`);
              try {
                if (controller.desiredSize !== null) {
                  const errorData = `data: ${JSON.stringify({
                    type: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString(),
                  })}\n\n`;
                  controller.enqueue(encoder.encode(errorData));
                }
              } catch (controllerError) {
                console.debug(
                  'Could not send error data, controller may be closed'
                );
              } finally {
                try {
                  controller.close();
                } catch (error) {
                  console.debug('Controller already closed');
                }
              }
            }
          };

          processWithLogs();
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Regular non-streaming response
    console.log(
      `🚀 Starting article generation for ${selectedBriefs.length} briefs.`
    );

    const results = await Promise.all(
      selectedBriefs.map((brief) =>
        processBrief(brief).catch((error) => {
          console.error(
            `❌ Error processing brief "${brief.topic}":`,
            error.message
          );
          // Return a fallback or error structure if a single brief fails
          return {
            id: `article-${brief.id}`,
            briefId: brief.id,
            keyword: brief.keyword,
            title: `Failed to process: ${brief.topic}`,
            content: `Error: ${error.message}\n\nFailed to generate content for ${brief.keyword}. Please try again.`,
            wordCount: 0,
          };
        })
      )
    );

    console.log(
      `🎉 Article generation complete: ${results.length} articles processed.`
    );

    return NextResponse.json(results, {
      headers: {
        'X-Generated-Articles': results.length.toString(),
        'X-Generation-Method': 'Direct Article Generation (Search + Write)',
        'X-Model': 'gpt-4o-search-preview',
      },
    });
  } catch (error: any) {
    console.error('❌ Error in article generation endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate articles.', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: 'healthy',
    services: {
      openai: hasOpenAI ? 'configured' : 'not configured',
      webSearch: hasOpenAI ? 'enabled' : 'disabled',
      articleGeneration: hasOpenAI ? 'enabled' : 'disabled',
    },
    features: [
      'Direct article generation with web research',
      'Human-like professional writing tone',
      'Real-time data collection and citations',
      'Practical, actionable content focus',
      'No JSON formatting - plain text articles',
    ],
    timestamp: new Date().toISOString(),
  });
}
