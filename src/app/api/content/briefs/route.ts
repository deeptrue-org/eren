import { NextResponse } from 'next/server';
import {
  BriefGeneratorService,
  BriefGenerationRequest,
  checkRateLimit,
  validateBriefGenerationRequest,
  createLogMessage,
} from '@/lib/brief-generation';

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
      generationMode = 'ai',
      notionUrl,
    } = requestData;

    const briefRequest: BriefGenerationRequest = {
      keywords,
      keywordExpansionData,
      gscData,
      generationMode,
      notionUrl,
    };

    const briefGenerator = new BriefGeneratorService();

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

    const results = await briefGenerator.generateBriefs(briefRequest);

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
      const sendLog = (message: string) => {
        try {
          if (controller.desiredSize !== null) {
            const logMessage = createLogMessage('log', message);
            const data = `data: ${JSON.stringify(logMessage)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.warn('Failed to send log, controller may be closed:', error);
        }
      };

      const processWithLogs = async () => {
        try {
          sendLog(
            `🚀 Starting brief generation for ${
              briefRequest.keywords.length
            } keywords: ${briefRequest.keywords.join(', ')}`
          );

          const briefGenerator = new BriefGeneratorService();
          const results = await briefGenerator.generateBriefs(
            briefRequest,
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
          controller.enqueue(encoder.encode(finalData));

          controller.close();
        } catch (error: any) {
          sendLog(`❌ Error in brief generation: ${error.message}`);
          const errorMessage = createLogMessage(
            'error',
            undefined,
            undefined,
            error.message
          );
          const errorData = `data: ${JSON.stringify(errorMessage)}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
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
