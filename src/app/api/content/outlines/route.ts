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
    `${keywords[0]} comparison 2025 latest pricing features`,
    `best ${keywords[0]} tools 2025 current pricing updates`,
    `latest ${keywords[0]} features updates 2025 market data`,
    `${keywords[0]} usage statistics 2025 enterprise adoption`,
    ...keywords
      .slice(1, 3)
      .map((kw) => `${kw} market trends 2025 latest developments`),
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
                  'You are a research assistant specialized in finding the most current 2025 market data. Use web search to find the latest information about the given topic. Prioritize recent developments, current pricing as of 2025, latest features, usage statistics, market trends, and company updates from this year.',
              },
              {
                role: 'user',
                content: `Research the following topic and provide the most current 2025 information: "${query}". Include specific company names, latest pricing details, newest features, usage statistics, market adoption data, and recent product updates. Focus on data from 2025 and late 2024.`,
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

// Replace the hard-coded structure-based prompts with style-driven instructions

function getPromptByTemplate(
  brief: ContentBrief,
  researchData: string
): string {
  const template = brief.template || 'comparison';
  const baseInfo = `
---
### **Core Task**
- **Topic:** "${brief.keyword}" for "${brief.target}".
- **Audience:** Professional technology audience in 2025.
- **Tone:** Objective, insightful, and authoritative. Not promotional.

---
### **Research Data**
${researchData}
---`;

  const sharedGuidance = `
You are a professional technology content writer and domain expert. Based on the research data, write a well-structured, engaging blog post that reflects the style described below:

### **Writing Style & Flow:**
- Write naturally, as if you're a seasoned blogger with deep industry insight.
- Create smooth transitions between sections - make each part flow naturally into the next.
- Use a clear and coherent narrative structure, but avoid rigid templates.
- Let the content flow logically depending on what the research reveals.
- Balance structure and flexibility: maintain clear sections but let content feel organic.

### **Content Quality & Research:**
- Prioritize helpful, real, current, and well-sourced information from reliable sources.
- Add updated research: supplement with the latest pricing, feature updates, usage statistics, or product developments as of 2025.
- Avoid repetition: remove or merge redundant points (don't mention the same feature multiple times).
- Integrate examples naturally: mention tools as part of the narrative, not in repetitive lists.
- Preserve accuracy: do not change existing factual data unless you find newer or more precise information.
- Polish language: use active voice, clear phrasing, and avoid unnecessary jargon.
- Include citations: provide links or references to reliable sources when adding new data.

### **Tone & Audience:**
- Use a professional but approachable tone suited for your target audience.
- Keep it objective, helpful, and authoritative without being promotional.
- Unify tone throughout - consistent voice from start to finish.

### **SEO & Branding:**
- Use subtle SEO optimization: naturally include the keyword in title, intro, and conclusion.
- Integrate "Deeptrue" where it makes sense, without over-promoting.
- Cite sources when referencing facts or data.
- Do not use placeholders. Do not invent facts.

Write a smooth, cohesive, and polished blog post that feels natural, authoritative, and engaging — ready for publication. The article should reflect the latest developments and current market realities as of 2025, with proper attribution to sources and data-backed insights throughout.
`;

  switch (template) {
    case 'comparison':
      return `${sharedGuidance}

### **Comparison Style Focus:**
Write a comparison-style article exploring different tools or services relevant to "${brief.keyword}" for "${brief.target}". Weave tool comparisons naturally into the narrative - don't just list features. Highlight key differences through storytelling, using both provided research and current 2025 data for pricing, features, and capabilities. Include specific usage statistics, recent updates, and market positioning to guide readers toward informed decisions.

${baseInfo}`;

    case 'tutorial':
      return `${sharedGuidance}

### **Tutorial Style Focus:**
Write a beginner-friendly tutorial that teaches "${brief.target}" how to achieve "${brief.keyword}". Create a conversational learning journey rather than a dry step-by-step list. Base explanations on current real-world tools and workflows as of 2025, building understanding progressively. Include the latest interface updates, new features, and current best practices. Make technical concepts accessible and connect each part to practical, up-to-date goals.

${baseInfo}`;

    case 'trend':
      return `${sharedGuidance}

### **Trend Analysis Focus:**
Write a trend-focused article that explores recent shifts or innovations in "${brief.keyword}". Tell the story of how the landscape is evolving through 2025 - don't just list trends. Connect past developments to current changes and future implications using the latest market data, adoption statistics, and product developments. Include specific examples of how leading companies are implementing these trends and quantifiable market changes.

${baseInfo}`;

    case 'guide':
      return `${sharedGuidance}

### **Practical Guide Focus:**
Write a helpful guide for readers interested in learning how to use or understand "${brief.keyword}". Create a journey from problem to solution using current 2025 tools and methods. Include the latest pricing information, feature capabilities, and implementation approaches. Weave together explanation, context, and actionable advice based on current market realities in a way that feels like expert consultation rather than a manual.

${baseInfo}`;

    case 'analysis':
      return `${sharedGuidance}

### **Analytical Focus:**
Write an analytical blog post that uses both provided research and current 2025 data to explore the impact or performance of "${brief.keyword}" in "${brief.target}". Build a compelling case through data storytelling with the latest usage statistics, market growth numbers, and ROI data. Include recent company reports, industry studies, and quantifiable trends to support a coherent analytical narrative that leads to meaningful, current insights.

${baseInfo}`;

    default:
      return `${sharedGuidance}

### **General Content Focus:**
Write a high-quality blog post about "${brief.keyword}" that would appeal to professionals in "${brief.target}". Create a compelling narrative that addresses their current needs and challenges using both provided research and latest 2025 market information. Include specific data points, current pricing, recent developments, and quantifiable trends. Let the structure follow the most logical and engaging path for readers - prioritize clarity, current relevance, and factual depth over formulaic approaches.

${baseInfo}`;
  }
}

async function generateFinalContent(
  brief: ContentBrief,
  researchData: string,
  sendLog?: (message: string) => void
): Promise<{ outline: OutlineSection[]; draft: string; notes: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  if (sendLog)
    sendLog(
      `📝 Creating detailed outline and full draft using ${
        brief.template || 'default'
      } template...`
    );

  const templatePrompt = getPromptByTemplate(brief, researchData);

  const prompt = `${templatePrompt}

### **Critical Instructions**
1. **Narrative Flow:** Ensure each paragraph flows logically into the next. Avoid abrupt shifts between topics and create smooth transitions that build a cohesive story rather than isolated blocks of information.

2. **Complete Draft:** The 'draft' field in your JSON response MUST contain the complete, ready-to-publish blog post with comprehensive, up-to-date information. Write it as a polished, publication-ready article with the latest 2025 data.

3. **Flexible Structure:** Organize the article clearly (intro, analysis, comparison, conclusion) but let the structure emerge naturally from the topic. The 'sections' field should have 3-4 main H2 sections that flow logically based on content needs.

4. **Research Integration & Updates:** Base all claims on the provided research data, but enhance with current 2025 information including latest pricing, feature updates, usage statistics, and product developments. Weave citations naturally into the text with proper attribution.

5. **Factual Depth:** Supplement the article with reliable online sources to add current data. Include specific numbers, percentages, company updates, and market trends. Cite sources appropriately.

6. **No Placeholders:** Write actual content with real, current data. No templates or placeholders like "[insert content here]". Every claim should be backed by either provided research or current 2025 information.

### **Return JSON Format**
{
  "sections": [
    {
      "id": "section-1",
      "title": "H2: [Your Creative Section Title]",
      "level": "H2",
      "wordCount": [estimated word count],
      "keywords": ["relevant", "keywords"],
      "children": []
    }
  ],
  "draft": "# [Your Creative Blog Post Title]\\n\\n[The complete 3500-4000 word blog post content here]",
  "notes": ["Any important notes or considerations"]
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
            'You are an elite blog writer and industry analyst who creates compelling, narrative-driven content ready for publication. Your expertise lies in weaving research data into cohesive stories that flow naturally and engage readers. You excel at crafting smooth transitions, avoiding repetition, and creating content that feels organic rather than templated. You have access to current 2025 market data and can supplement provided research with the latest pricing, feature updates, usage statistics, and product developments. Use both provided research data and current information to create accurate, well-sourced, and up-to-date content with proper citations.',
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
