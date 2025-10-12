import { NextResponse } from 'next/server';
import {
  BriefGenerationRequest,
  checkRateLimit,
  validateBriefGenerationRequest,
  createLogMessage,
} from '@/lib/brief-generation';
import { UnifiedContentService } from '@/lib/unified-content-service';

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(req: Request) {
  try {
    const requestData = await req.json();

    // Validate request
    const validation = validateBriefGenerationRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const {
      keywords,
      stream,
      keywordExpansionData,
      gscData,
      notionUrl,
      userContext,
    } = requestData;

    const briefRequest: BriefGenerationRequest = {
      keywords,
      keywordExpansionData,
      gscData,
      notionUrl,
      userContext,
    };

    const unifiedService = new UnifiedContentService();

    // Handle streaming response
    if (stream) {
      return handleStreamingResponse(briefRequest);
    }

    // Handle regular response
    console.log(
      `🚀 Starting brief generation for ${
        keywords.length
      } keywords: ${keywords.join(', ')}`
    );

    const results = await unifiedService.generateBriefs({
      keywords: briefRequest.keywords,
      keywordExpansionData: briefRequest.keywordExpansionData,
      notionUrl: briefRequest.notionUrl,
      userContext: briefRequest.userContext,
    });

    console.log(
      `🎉 Brief generation complete. Keywords processed: ${
        Object.keys(results).length
      }`
    );

    return NextResponse.json(
      { results },
      {
        headers: {
          'X-Generated-Keywords': Object.keys(results).length.toString(),
          'X-Total-Briefs': Object.values(results)
            .reduce((sum, briefs) => sum + briefs.length, 0)
            .toString(),
          'X-Generation-Method': 'AI Knowledge Base',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error in brief generation endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate content briefs.',
        details: error.message,
      },
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
      briefGeneration: hasOpenAI ? 'enabled' : 'disabled',
    },
    features: [
      'Content brief generation',
      'AI-powered insights',
      'Multi-keyword processing',
      'Industry knowledge base',
    ],
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// STREAMING RESPONSE HANDLER
// ============================================================================

function handleStreamingResponse(briefRequest: BriefGenerationRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      let closed = false;

      const safeEnqueue = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          closed = true;
          console.warn('Failed to send data, controller may be closed:', error);
        }
      };

      const safeClose = () => {
        if (closed) return;
        try {
          controller.close();
        } catch (_) {
          // ignore
        } finally {
          closed = true;
        }
      };

      const sendLog = (message: string) => {
        const logMessage = createLogMessage('log', message);
        const data = `data: ${JSON.stringify(logMessage)}\n\n`;
        safeEnqueue(data);
      };

      const processWithLogs = async () => {
        try {
          sendLog(
            `🚀 Starting brief generation for ${
              briefRequest.keywords.length
            } keywords: ${briefRequest.keywords.join(', ')}`
          );

          const unifiedService = new UnifiedContentService();
          const results = await unifiedService.generateBriefs(
            {
              keywords: briefRequest.keywords,
              keywordExpansionData: briefRequest.keywordExpansionData,
              notionUrl: briefRequest.notionUrl,
            },
            sendLog
          );

          const totalBriefs = Object.values(results).reduce(
            (sum, briefList) => sum + briefList.length,
            0
          );

          sendLog(
            `🎉 Brief generation complete: ${
              Object.keys(results).length
            } keywords processed, ${totalBriefs} total briefs.`
          );

          // Send final results
          const completeMessage = createLogMessage(
            'complete',
            undefined,
            results
          );
          const finalData = `data: ${JSON.stringify(completeMessage)}\n\n`;
          safeEnqueue(finalData);

          safeClose();
        } catch (error: any) {
          sendLog(`❌ Error in brief generation: ${error.message}`);
          const errorMessage = createLogMessage(
            'error',
            undefined,
            undefined,
            error.message
          );
          const errorData = `data: ${JSON.stringify(errorMessage)}\n\n`;
          safeEnqueue(errorData);
          safeClose();
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
