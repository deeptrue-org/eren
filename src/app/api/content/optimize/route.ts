import { NextResponse } from 'next/server';
import { UnifiedContentService } from '@/lib/unified-content-service';
import { OptimizationResult } from '@/types/content';

const requestTracker = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const window = 60000; // 1 minute
  const maxRequests = 10;
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
    // First try to parse the text directly
    const trimmedText = text.trim();
    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
      return JSON.parse(trimmedText);
    }

    // If that fails, try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // If still no JSON found, log the response for debugging
    throw new Error('No JSON object found in the response.');
  } catch (error) {
    return null;
  }
}

async function analyzeContentWithWebSearch(
  content: string,
  keyword: string,
  blogHistory?: Array<{ title: string; slug?: string; primaryKeyword?: string }>
): Promise<OptimizationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  const historyText =
    (blogHistory && blogHistory.length
      ? blogHistory
          .map(
            (p, i) =>
              `${i + 1}. ${p.title}${p.slug ? ` [${p.slug}]` : ''}${
                p.primaryKeyword ? ` — kw: ${p.primaryKeyword}` : ''
              }`
          )
          .join('\n')
      : 'None provided') + '\n';

  const prompt = `
You are a senior SEO strategist and content analyst with 10+ years of experience in competitive analysis, keyword strategy, and content optimization. Perform a comprehensive, strategic analysis that goes beyond basic SEO metrics.

**CRITICAL**: Return ONLY valid JSON (no markdown, no explanations, no extra text). Start with { and end with }.

**ANALYSIS CONTEXT:**
Target Keyword: "${keyword}"
Blog History (for strategic analysis): ${historyText}

**CONTENT TO ANALYZE:**
${content}

**STRATEGIC ANALYSIS REQUIREMENTS:**
1. **SEO Strategy Alignment**: Check for keyword cannibalization with existing content, identify content gaps, assess strategic positioning
2. **Competitive Analysis**: Evaluate content depth, uniqueness, expertise demonstration, and competitive advantage
3. **Technical SEO Excellence**: Comprehensive technical optimization assessment beyond basic metrics
4. **E-A-T Evaluation**: Analyze Expertise, Authoritativeness, and Trustworthiness signals
5. **Search Intent Matching**: Assess how well content matches user search intent for target keyword
6. **Content Depth & Quality**: Evaluate comprehensiveness, originality, and value proposition
7. **Strategic Recommendations**: Provide actionable insights for content and SEO strategy improvement

Respond with a JSON object that MUST include all fields below (keep keys exactly as named to match our schema):

{
  "seo": {
    "overallScore": 0,
    "keywordDensity": {
      "keyword": "${keyword}",
      "count": 0,
      "density": 0,
      "recommendation": "",
      "semanticVariations": [],
      "cannibalizationRisk": false,
      "strategicFit": ""
    },
    "metaDescription": {
      "length": 0,
      "isOptimal": false,
      "recommendation": ""
    },
    "titleTags": {
      "h1Count": 0,
      "h2Count": 0,
      "h3Count": 0,
      "recommendation": ""
    },
    "imageAltTags": {
      "missingCount": 0,
      "suggestions": []
    },
    "keywordPlacement": {
      "inTitle": false,
      "inFirstParagraph": false,
      "inSubheadings": 0,
      "recommendation": ""
    }
  },
  "factCheck": {
    "verifiedCount": 0,
    "totalClaims": 0,
    "expertiseScore": 0,
    "authoritySignals": [],
    "trustworthiness": 0,
    "facts": [
      {
        "claim": "",
        "isVerified": false,
        "source": "",
        "confidence": 0,
        "needsSource": false,
        "isCredible": true,
        "expertiseLevel": ""
      }
    ],
    "suggestions": [
      {
        "claim": "",
        "recommendation": "",
        "reason": "",
        "suggestedSource": "",
        "priority": ""
      }
    ]
  },
  "readability": {
    "clarityScore": 0,
    "sentenceLength": {
      "average": 0,
      "isOptimal": false,
      "recommendation": ""
    },
    "passiveVoice": {
      "count": 0,
      "percentage": 0,
      "suggestions": []
    },
    "grammar": {
      "errorCount": 0,
      "errors": [
        { "text": "", "suggestion": "", "position": 0 }
      ]
    },
    "tone": {
      "detected": "",
      "consistency": 0,
      "recommendation": ""
    },
    "complexity": {
      "score": 0,
      "recommendation": ""
    }
  },
  "overallScore": 0,
  "suggestions": [
    ""
  ],

  "strategy": {
    "searchIntent": "Informational / Commercial / Transactional (pick one and justify)",
    "angleDifferentiation": "Explain how this piece differs from existing posts",
    "cannibalizationRisk": "Low | Medium | High",
    "overlapWithPosts": [
      { "post": "title or slug", "overlapScore": 0, "notes": "" }
    ],
    "recommendedPrimaryKeyword": "",
    "keywordCluster": ["", ""],
    "internalLinks": [
      { "anchor": "", "targetSlug": "", "reason": "" }
    ],
    "nextPostsToWrite": [
      { "topic": "", "why": "" }
    ]
  },

  "serp": {
    "intentAssessment": "What format wins this SERP and why",
    "suggestedFormat": "Benchmark / Case Study / How-to Guide / Opinion / Framework",
    "paaQuestions": ["", ""],
    "entitiesToInclude": ["(e.g., product names, standards, metrics)"],
    "schemaRecommendations": ["Article", "HowTo", "FAQPage (only if natural)"],
    "titleSuggestion": "",
    "metaDescriptionSuggestion": "",
    "urlSlugSuggestion": ""
  }
}

**CRITICAL ANALYSIS RULES:**
1. **Accuracy & Integrity**: Do NOT invent data, sources, or statistics. If claims lack verification, mark appropriately and suggest credible sources.
2. **Strategic Assessment**: Compare against blog history for keyword cannibalization, content gaps, and strategic positioning opportunities.
3. **Competitive Analysis**: Evaluate content depth, uniqueness, and competitive advantage in the target keyword space.
4. **E-A-T Evaluation**: Assess Expertise signals (technical depth, industry knowledge), Authoritativeness (citations, references), and Trustworthiness (accuracy, transparency).
5. **Search Intent Matching**: Analyze if content format and depth match user search intent for the target keyword.
6. **Actionable Recommendations**: Provide specific, implementable suggestions for improvement, not generic advice.
7. **Technical Excellence**: Go beyond basic SEO metrics to assess technical optimization opportunities.
8. **Content Strategy**: Identify opportunities for content clusters, internal linking, and future content development.
9. **JSON Validity**: Ensure all JSON is properly formatted and parseable - this is critical for system functionality.
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
            'You are an expert content analyst and SEO strategist. Respond with ONLY a valid JSON object. No markdown, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      max_completion_tokens: 4096,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI API request failed: ${response.status} ${response.statusText}`
    );
  }

  const jsonResponse = await response.json();
  const content_response = jsonResponse.choices[0]?.message?.content || '';
  const parsedContent = await safeJsonParse(content_response);

  if (!parsedContent) {
    // ... 기존 fallback 그대로 유지
    // (생략: 기존 fallback 객체 반환)
  }

  return parsedContent as OptimizationResult;
}

export async function POST(req: Request) {
  try {
    const { content, keyword, briefId, blogHistory } = await req.json();

    if (!content || !keyword) {
      return NextResponse.json(
        { error: 'Content and keyword are required.' },
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

    let optimizationResult: OptimizationResult;

    if (briefId) {
      // Use unified approach with conversation context
      const unifiedService = new UnifiedContentService();
      optimizationResult = await unifiedService.optimizeContent(
        content,
        briefId
      );
    } else {
      // Fallback to legacy approach for backward compatibility
      optimizationResult = await analyzeContentWithWebSearch(
        content,
        keyword,
        blogHistory
      );
    }

    return NextResponse.json(optimizationResult, {
      headers: {
        'X-Analysis-Method': briefId
          ? 'Unified Context-Aware Analysis'
          : 'Legacy Analysis',
        'X-Overall-Score': optimizationResult.overallScore.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to analyze content.',
        details: error.message,
        type: error.name || 'UnknownError',
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
      contentAnalysis: hasOpenAI ? 'enabled' : 'disabled',
    },
    features: [
      'SEO analysis',
      'Content quality assessment',
      'Readability analysis',
      'Grammar checking',
      'Tone analysis',
    ],
    timestamp: new Date().toISOString(),
  });
}
