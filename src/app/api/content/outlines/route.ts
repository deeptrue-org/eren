import { NextResponse } from 'next/server';
import { ContentBrief } from '@/lib/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OutlineSection {
  id: string;
  title: string;
  level: 'H1' | 'H2' | 'H3';
  wordCount: number;
  keywords?: string[];
  children: OutlineSection[];
}

export interface ContentOutline {
  id: string;
  briefId: string;
  keyword: string;
  title: string;
  totalWordCount: number;
  sections: OutlineSection[];
  draft: string;
  internalNotes: string[];
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
    // Attempt to find the JSON object within the text
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
// CORE LOGIC: TRANSLATE, RESEARCH, GENERATE
// ============================================================================

async function translateKeywordsToEnglish(
  keywords: string[],
  sendLog?: (message: string) => void
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return keywords;

  const nonEnglishKeywords = keywords.filter((kw) => /[^\x00-\x7F]/.test(kw));
  if (nonEnglishKeywords.length === 0) {
    if (sendLog) sendLog(`✅ Keywords are already in English`);
    return keywords;
  }

  if (sendLog)
    sendLog(
      `🌐 Translating ${nonEnglishKeywords.length} keywords to English...`
    );

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional translator.' },
          {
            role: 'user',
            content: `Translate these keywords to English for search: \n${nonEnglishKeywords.join(
              '\n'
            )}\n\nReturn only the translated keywords, one per line.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const translations =
        data.choices[0]?.message?.content?.split('\n').filter(Boolean) || [];
      if (translations.length === nonEnglishKeywords.length) {
        const translatedMap = new Map(
          nonEnglishKeywords.map((kw, i) => [kw, translations[i]])
        );
        const finalKeywords = keywords.map((kw) => translatedMap.get(kw) || kw);
        const translationMsg = `✅ Keywords translated: ${finalKeywords.join(
          ', '
        )}`;
        console.log(translationMsg);
        if (sendLog) sendLog(translationMsg);
        return finalKeywords;
      }
    }
  } catch (error) {
    const errorMsg = `❌ Translation failed: ${error}`;
    console.warn(errorMsg);
    if (sendLog) sendLog(errorMsg);
  }
  return keywords;
}

async function researchTopic(
  keywords: string[],
  sendLog?: (message: string) => void
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const warningMsg = 'OpenAI API key not configured. Skipping research.';
    console.warn(warningMsg);
    if (sendLog) sendLog(`⚠️ ${warningMsg}`);
    return 'No research data available. Rely on general knowledge.';
  }

  const searchQueries = [
    `${keywords[0]} comparison 2025`,
    `best ${keywords[0]} tools and pricing`,
    `latest ${keywords[0]} features and updates`,
    ...keywords.slice(1, 3).map((kw) => `${kw} market trends 2025`),
  ];

  let researchData = '';

  for (const query of searchQueries) {
    try {
      if (sendLog) sendLog(`🔎 Researching: "${query}"`);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-search-preview',
            web_search_options: {
              search_context_size: 'high',
            },
            messages: [
              {
                role: 'system',
                content:
                  'You are a research assistant. Use web search to find current, accurate information about the given topic. Focus on real companies, pricing, features, and recent developments.',
              },
              {
                role: 'user',
                content: `Research the following topic and provide current, factual information: "${query}". Include specific company names, pricing details, features, and recent updates.`,
              },
            ],
            max_tokens: 1000,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        const annotations = data.choices[0]?.message?.annotations || [];

        // Extract citations
        const citations = annotations
          .filter((annotation: any) => annotation.type === 'url_citation')
          .map(
            (annotation: any) =>
              `- ${annotation.url_citation.title}: ${annotation.url_citation.url}`
          )
          .join('\n');

        researchData += `\n\n--- Research for: "${query}" ---\n`;
        researchData += content || '';
        if (citations) {
          researchData += `\n\nSources:\n${citations}`;
        }
        researchData += '\n';

        const completionMsg = `✅ Research completed for: "${query}"`;
        console.log(completionMsg);
        if (sendLog) sendLog(completionMsg);
      }
    } catch (error) {
      const errorMsg = `❌ Research failed for query "${query}": ${error}`;
      console.warn(errorMsg);
      if (sendLog) sendLog(errorMsg);
    }
  }

  return researchData || 'Research phase completed, but no data was found.';
}

async function generateFinalContent(
  brief: ContentBrief,
  researchData: string,
  sendLog?: (message: string) => void
): Promise<{ outline: OutlineSection[]; draft: string; notes: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  if (sendLog) sendLog(`📝 Creating detailed outline and full draft...`);

  const prompt = `
You are a professional blog writer. Your primary goal is to write a complete, high-quality, SEO-optimized blog post of 3500-4000 words.

Use the provided research data to write factual, well-sourced content. Base all specific claims, company names, features, and pricing on the research data provided.

---
### **Core Task**
- **Topic:** "${brief.keyword}" for "${brief.target}".
- **Audience:** Professional technology audience in 2025.
- **Tone:** Objective, insightful, and authoritative. Not promotional.

---
### **Critical Instructions**
1. **Use Research Data:** Base all specific claims, company names, features, and pricing on the provided research data. Do not invent information.

2. **Write the Full Draft:** The 'draft' field in your JSON response MUST contain the complete, ready-to-publish blog post with real information from the research.

3. **Create a Clear Outline:** The 'sections' field should have 3-4 main H2 sections that flow logically. Only add H3 sub-sections when truly necessary for clarity (1-2 per H2 section maximum).

4. **Include Citations:** When using information from research data, reference the sources provided.

5. **No Placeholders:** The draft must be complete with real data from research. Do not use placeholders like "[insert content here]".

6. **Subtle Deeptrue Mention:** Naturally integrate "Deeptrue" within the content for comparison or to highlight a unique strength, avoiding a sales pitch.

---
### **Research Data**
${researchData}
---

### **Return JSON Format**
{
  "sections": [
    {
      "id": "section-1",
      "title": "H2: Understanding the Challenge",
      "level": "H2",
      "wordCount": 900,
      "keywords": ["challenge", "problem"],
      "children": []
    },
    {
      "id": "section-2", 
      "title": "H2: Top Solutions and Tools",
      "level": "H2",
      "wordCount": 1200,
      "keywords": ["solutions", "tools", "comparison"],
      "children": [
        { "id": "section-2-1", "title": "H3: Enterprise Solutions", "level": "H3", "wordCount": 600, "keywords": ["enterprise"], "children": [] },
        { "id": "section-2-2", "title": "H3: Budget-Friendly Options", "level": "H3", "wordCount": 600, "keywords": ["budget"], "children": [] }
      ]
    },
    {
      "id": "section-3",
      "title": "H2: Implementation Best Practices", 
      "level": "H2",
      "wordCount": 800,
      "keywords": ["implementation", "best practices"],
      "children": []
    },
    {
      "id": "section-4",
      "title": "H2: Future Outlook and Recommendations",
      "level": "H2", 
      "wordCount": 700,
      "keywords": ["future", "recommendations"],
      "children": []
    }
  ],
  "draft": "# [Engaging Blog Post Title]\\n\\n**Introduction:** [The full 3500-4000 word blog post starts here with information from research data.]",
  "notes": ["Note about a specific data point to double-check.", "Note about a potential image to add."]
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
            'You are an elite blog writer and industry analyst who produces long-form, data-driven, and engaging articles ready for publication. Use the provided research data to create accurate, well-sourced content with real company names and current information.',
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
    const errorMsg = `OpenAI API Error: ${response.status} ${response.statusText}`;
    console.error(errorMsg, errorBody);
    if (sendLog) sendLog(`❌ ${errorMsg}`);
    throw new Error(
      `OpenAI API request failed: ${response.status} ${response.statusText}`
    );
  }

  if (sendLog)
    sendLog(`🤖 Processing AI response and creating final content...`);

  const jsonResponse = await response.json();
  const content = jsonResponse.choices[0]?.message?.content;

  const parsedContent = await safeJsonParse(content);

  if (!parsedContent) {
    throw new Error('Failed to parse valid JSON from OpenAI response.');
  }

  return {
    outline: parsedContent.sections || [],
    draft: parsedContent.draft || '',
    notes: parsedContent.notes || [],
  };
}

// ============================================================================
// MAIN HANDLER & WORKFLOW
// ============================================================================

async function processBrief(
  brief: ContentBrief,
  sendLog?: (message: string) => void
): Promise<ContentOutline> {
  const allKeywords = [brief.keyword, ...(brief.relatedKeywords || [])];

  if (sendLog) sendLog(`🔍 Processing brief: "${brief.topic}"`);
  if (sendLog) sendLog(`📝 Translating keywords to English...`);
  const translatedKeywords = await translateKeywordsToEnglish(
    allKeywords,
    sendLog
  );

  if (sendLog) sendLog(`🔎 Researching topic with web search...`);
  const researchData = await researchTopic(translatedKeywords, sendLog);

  if (sendLog) sendLog(`✍️ Generating final content and outline...`);
  const { outline, draft, notes } = await generateFinalContent(
    brief,
    researchData,
    sendLog
  );

  const totalWordCount = outline.reduce(
    (sum, section) =>
      sum +
      section.wordCount +
      (section.children?.reduce(
        (childSum, child) => childSum + child.wordCount,
        0
      ) || 0),
    0
  );

  if (sendLog)
    sendLog(
      `✅ Completed outline for "${brief.topic}" (${totalWordCount} words)`
    );

  return {
    id: `outline-${brief.id}`,
    briefId: brief.id,
    keyword: brief.keyword,
    title: brief.topic,
    totalWordCount,
    sections: outline,
    draft,
    internalNotes: notes,
  };
}

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
    if (!checkRateLimit(clientIP)) {
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
                `🚀 Starting two-stage outline generation for ${selectedBriefs.length} briefs.`
              );

              const results = await Promise.all(
                selectedBriefs.map((brief) =>
                  processBrief(brief, sendLog).catch((error) => {
                    const errorMessage = `❌ Error processing brief "${brief.topic}": ${error.message}`;
                    console.error(errorMessage);
                    sendLog(errorMessage);
                    // Return a fallback or error structure if a single brief fails
                    return {
                      id: `outline-${brief.id}`,
                      briefId: brief.id,
                      keyword: brief.keyword,
                      title: `Failed to process: ${brief.topic}`,
                      totalWordCount: 0,
                      sections: [],
                      draft: `Error: ${error.message}`,
                      internalNotes: [
                        `Failed to generate content for ${brief.keyword}. Please try again.`,
                      ],
                    };
                  })
                )
              );

              sendLog(
                `🎉 Two-stage outline generation complete: ${results.length} outlines processed.`
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
              sendLog(`❌ Error in outline generation: ${error.message}`);
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
      `🚀 Starting two-stage outline generation for ${selectedBriefs.length} briefs.`
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
            id: `outline-${brief.id}`,
            briefId: brief.id,
            keyword: brief.keyword,
            title: `Failed to process: ${brief.topic}`,
            totalWordCount: 0,
            sections: [],
            draft: `Error: ${error.message}`,
            internalNotes: [
              `Failed to generate content for ${brief.keyword}. Please try again.`,
            ],
          };
        })
      )
    );

    console.log(
      `🎉 Two-stage outline generation complete: ${results.length} outlines processed.`
    );

    return NextResponse.json(results, {
      headers: {
        'X-Generated-Outlines': results.length.toString(),
        'X-Generation-Method': 'Two-Stage AI (Search + Write)',
        'X-Research-Model': 'gpt-4o-search-preview',
        'X-Writing-Model': 'gpt-4o',
      },
    });
  } catch (error: any) {
    console.error('❌ Error in outline generation endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate content outlines.', details: error.message },
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
      contentGeneration: hasOpenAI ? 'enabled' : 'disabled',
    },
    features: [
      'Web research with gpt-4o-search-preview',
      'Content generation with gpt-4o',
      'Real-time data collection',
      'Efficient two-stage processing',
    ],
    timestamp: new Date().toISOString(),
  });
}
