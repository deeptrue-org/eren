import { NextResponse } from 'next/server';
import { ContentBrief } from '@/lib/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BriefGenerationRequest {
  keywords: string[];
}

// ============================================================================
// UTILITIES
// ============================================================================

const requestTracker = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const window = 60000; // 1 minute
  const maxRequests = 5;
  const record = requestTracker.get(identifier);

  if (!record || now > record.resetTime) {
    requestTracker.set(identifier, { count: 1, resetTime: now + window });
    return true;
  }
  if (record.count >= maxRequests) return false;

  record.count++;
  return true;
}

async function safeJsonParse(text: string): Promise<any> {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON object found in the response.');
  } catch (error) {
    console.warn('Failed to parse JSON, returning null:', error);
    return null;
  }
}

// ============================================================================
// CORE LOGIC: BRIEF GENERATION WITH WEB SEARCH
// ============================================================================

async function generateBriefsWithWebSearchWithLogs(
  keywords: string[],
  sendLog?: (message: string) => void
): Promise<Record<string, ContentBrief[]>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  const results: Record<string, ContentBrief[]> = {};

  for (const keyword of keywords) {
    const logMessage = `🚀 Generating briefs for keyword: "${keyword}"`;
    console.log(logMessage);
    if (sendLog) sendLog(logMessage);

    const prompt = `
You are a content strategist. Generate 5 diverse content briefs for the keyword "${keyword}".

Generate comprehensive briefs with realistic company names, pricing information, and market data based on your knowledge of the industry.

---
### **Keyword to analyze:** "${keyword}"

### **Tasks:**
1. **Include realistic information about:**
   - Leading companies/services in this space
   - Current market trends and developments
   - Popular tools and typical pricing ranges
   - Industry best practices
   - Common use cases and challenges

2. **Generate 5 content briefs with different angles:**
   - Analyze the keyword and identify the most relevant target audiences for this topic
   - Select 5 different target audiences that would actually search for or benefit from this keyword
   - Use different content intents (Comparison, How-to, Review, Case Study, Best Practices, Troubleshooting)
   - Include specific, actionable information

---
### **Return JSON Format:**
{
  "briefs": [
    {
      "id": "${keyword.replace(/\s+/g, '-').toLowerCase()}-brief-1",
      "keyword": "${keyword}",
      "topic": "Complete, specific topic title with real companies/tools mentioned",
      "target": "Analyze and determine the most relevant target audience for this keyword",
      "intent": "Comparison",
      "difficulty": "Medium",
      "searchVolume": 45000,
      "outline": [
        "Introduction to leading tools in the space",
        "Detailed comparison of popular services",
        "Implementation strategies and best practices",
        "Conclusion with recommendations"
      ],
      "relatedKeywords": ["related keyword 1", "related keyword 2"],
      "metaDescription": "SEO-optimized meta description with clear value proposition"
    }
  ]
}
`;

    if (sendLog) sendLog(`📝 Sending request to OpenAI for "${keyword}"...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert content strategist who creates data-driven content briefs. Generate comprehensive briefs with realistic company names, tools, and market data based on your knowledge.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API Error:', errorBody);
      throw new Error(
        `OpenAI API request failed: ${response.status} ${response.statusText}`
      );
    }

    if (sendLog)
      sendLog(`🤖 Processing response from OpenAI for "${keyword}"...`);

    const jsonResponse = await response.json();
    const content = jsonResponse.choices[0]?.message?.content;

    const parsedContent = await safeJsonParse(content);

    if (!parsedContent || !parsedContent.briefs) {
      throw new Error(`Failed to generate briefs for keyword: ${keyword}`);
    }

    // Enhance briefs with fallback data
    const enhancedBriefs = parsedContent.briefs.map((brief: any) => ({
      ...brief,
      searchVolume:
        brief.searchVolume || Math.floor(Math.random() * 50000) + 10000, // Fallback
      difficulty:
        brief.difficulty ||
        ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    }));

    results[keyword] = enhancedBriefs;
    const completionMessage = `✅ Generated ${enhancedBriefs.length} briefs for "${keyword}"`;
    console.log(completionMessage);
    if (sendLog) sendLog(completionMessage);
  }

  return results;
}

async function generateBriefsWithWebSearch(
  keywords: string[]
): Promise<Record<string, ContentBrief[]>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  const results: Record<string, ContentBrief[]> = {};

  for (const keyword of keywords) {
    console.log(`🚀 Generating briefs for keyword: "${keyword}"`);

    const prompt = `
You are a content strategist. Generate 5 diverse content briefs for the keyword "${keyword}".

Generate comprehensive briefs with realistic company names, pricing information, and market data based on your knowledge of the industry.

---
### **Keyword to analyze:** "${keyword}"

### **Tasks:**
1. **Include realistic information about:**
   - Leading companies/services in this space
   - Current market trends and developments
   - Popular tools and typical pricing ranges
   - Industry best practices
   - Common use cases and challenges

2. **Generate 5 content briefs with different angles:**
   - Analyze the keyword and identify the most relevant target audiences for this topic
   - Select 5 different target audiences that would actually search for or benefit from this keyword
   - Use different content intents (Comparison, How-to, Review, Case Study, Best Practices, Troubleshooting)
   - Include specific, actionable information

---
### **Return JSON Format:**
{
  "briefs": [
    {
      "id": "${keyword.replace(/\s+/g, '-').toLowerCase()}-brief-1",
      "keyword": "${keyword}",
      "topic": "Complete, specific topic title with real companies/tools mentioned",
      "target": "Analyze and determine the most relevant target audience for this keyword",
      "intent": "Comparison",
      "difficulty": "Medium",
      "searchVolume": 45000,
      "outline": [
        "Introduction to leading tools in the space",
        "Detailed comparison of popular services",
        "Implementation strategies and best practices",
        "Conclusion with recommendations"
      ],
      "relatedKeywords": ["related keyword 1", "related keyword 2"],
      "metaDescription": "SEO-optimized meta description with clear value proposition"
    }
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert content strategist who creates data-driven content briefs. Generate comprehensive briefs with realistic company names, tools, and market data based on your knowledge.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API Error:', errorBody);
      throw new Error(
        `OpenAI API request failed: ${response.status} ${response.statusText}`
      );
    }

    const jsonResponse = await response.json();
    const content = jsonResponse.choices[0]?.message?.content;

    const parsedContent = await safeJsonParse(content);

    if (!parsedContent || !parsedContent.briefs) {
      throw new Error(`Failed to generate briefs for keyword: ${keyword}`);
    }

    // Enhance briefs with fallback data
    const enhancedBriefs = parsedContent.briefs.map((brief: any) => ({
      ...brief,
      searchVolume:
        brief.searchVolume || Math.floor(Math.random() * 50000) + 10000, // Fallback
      difficulty:
        brief.difficulty ||
        ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    }));

    results[keyword] = enhancedBriefs;
    console.log(
      `✅ Generated ${enhancedBriefs.length} briefs for "${keyword}"`
    );
  }

  return results;
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(req: Request) {
  try {
    const { keywords, stream } = await req.json();

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required.' },
        { status: 400 }
      );
    }

    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
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
              if (controller.desiredSize !== null) {
                const data = `data: ${JSON.stringify({
                  type: 'log',
                  message,
                  timestamp: new Date().toISOString(),
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            } catch (error) {
              console.warn(
                'Failed to send log, controller may be closed:',
                error
              );
            }
          };

          const processWithLogs = async () => {
            try {
              sendLog(
                `🚀 Starting brief generation for ${
                  keywords.length
                } keywords: ${keywords.join(', ')}`
              );

              const results = await generateBriefsWithWebSearchWithLogs(
                keywords,
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
              const finalData = `data: ${JSON.stringify({
                type: 'complete',
                results,
                timestamp: new Date().toISOString(),
              })}\n\n`;
              controller.enqueue(encoder.encode(finalData));

              controller.close();
            } catch (error: any) {
              sendLog(`❌ Error in brief generation: ${error.message}`);
              const errorData = `data: ${JSON.stringify({
                type: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
              })}\n\n`;
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

    // Regular non-streaming response
    console.log(
      `🚀 Starting brief generation for ${
        keywords.length
      } keywords: ${keywords.join(', ')}`
    );

    const results = await generateBriefsWithWebSearch(keywords);

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
