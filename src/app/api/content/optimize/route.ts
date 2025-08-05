import { NextResponse } from 'next/server';
import { OptimizationResult } from '@/types/content';
import { UnifiedContentService } from '@/lib/unified-content-service';

// ============================================================================
// RATE LIMITING & UTILITIES
// ============================================================================

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
// OPTIMIZATION & FACT CHECKING WITH WEB SEARCH
// ============================================================================

async function analyzeContentWithWebSearch(
  content: string,
  keyword: string
): Promise<OptimizationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  const prompt = `
You are an expert content analyst and SEO specialist. Analyze the provided content for SEO optimization, readability, and content quality.

Provide realistic metrics and actionable recommendations based on SEO best practices and content analysis.

---
### **Content to Analyze:**
**Target Keyword:** "${keyword}"

**Content:**
${content}

---
### **Analysis Tasks:**

1. **SEO Analysis:**
   - Calculate keyword density for "${keyword}"
   - Check meta description length (if present)
   - Analyze heading structure (H1, H2, H3)
   - Identify missing image alt tags
   - Check keyword placement in title and first paragraph

2. **Content Quality Analysis:**
   - Identify factual claims and statements that need sources
   - Check for content accuracy and consistency
   - Verify information appears credible and well-researched
   - Rate content trustworthiness

3. **Readability Analysis:**
   - Calculate average sentence length
   - Identify passive voice usage
   - Check for grammar and spelling errors
   - Analyze tone consistency
   - Assess content complexity

---
### **Return JSON Format:**
{
  "seo": {
    "overallScore": 85,
    "keywordDensity": {
      "keyword": "${keyword}",
      "count": 12,
      "density": 2.1,
      "recommendation": "Keyword density is optimal. Consider adding variations."
    },
    "metaDescription": {
      "length": 145,
      "isOptimal": true,
      "recommendation": "Meta description length is perfect for SEO."
    },
    "titleTags": {
      "h1Count": 1,
      "h2Count": 4,
      "h3Count": 8,
      "recommendation": "Good heading structure. H1 is unique and H2/H3 are well distributed."
    },
    "imageAltTags": {
      "missingCount": 2,
      "suggestions": ["AI automation dashboard screenshot", "Workflow comparison chart"]
    },
    "keywordPlacement": {
      "inTitle": true,
      "inFirstParagraph": true,
      "inSubheadings": 3,
      "recommendation": "Excellent keyword placement across all key areas."
    }
  },
  "factCheck": {
    "verifiedCount": 8,
    "totalClaims": 10,
    "facts": [
      {
        "claim": "AI can reduce manual work by 40%",
        "needsSource": false,
        "isCredible": true,
        "confidence": 85
      }
    ],
    "suggestions": [
      {
        "claim": "Recent market research shows...",
        "recommendation": "Add a specific source or study reference",
        "reason": "This claim needs a reliable source for credibility"
      }
    ]
  },
  "readability": {
    "clarityScore": 78,
    "sentenceLength": {
      "average": 18,
      "isOptimal": true,
      "recommendation": "Sentence length is well balanced for readability."
    },
    "passiveVoice": {
      "count": 3,
      "percentage": 8.5,
      "suggestions": ["Change 'was implemented' to 'the team implemented'"]
    },
    "grammar": {
      "errorCount": 1,
      "errors": [
        {
          "text": "there implementation",
          "suggestion": "their implementation",
          "position": 450
        }
      ]
    },
    "tone": {
      "detected": "Professional",
      "consistency": 85,
      "recommendation": "Tone is mostly consistent. Consider making the conclusion more authoritative."
    },
    "complexity": {
      "score": 72,
      "recommendation": "Content complexity is appropriate for the target audience."
    }
  },
  "overallScore": 81,
  "suggestions": [
    "Add more reliable sources for factual claims",
    "Optimize keyword placement in subheadings",
    "Fix minor grammar errors"
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
            'You are an expert content analyst and SEO specialist. Analyze content for SEO optimization, readability, and provide comprehensive feedback with realistic metrics and suggestions.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('OpenAI API Error:', errorBody);
    console.error('Response status:', response.status, response.statusText);

    // More detailed error handling
    if (response.status === 401) {
      throw new Error('OpenAI API key is invalid or missing');
    } else if (response.status === 403) {
      throw new Error(
        'OpenAI API access forbidden - check your API key permissions'
      );
    } else if (response.status === 429) {
      throw new Error(
        'OpenAI API rate limit exceeded - please try again later'
      );
    } else {
      throw new Error(
        `OpenAI API request failed: ${response.status} ${response.statusText}`
      );
    }
  }

  const jsonResponse = await response.json();
  const content_response = jsonResponse.choices[0]?.message?.content;

  const parsedContent = await safeJsonParse(content_response);

  if (!parsedContent) {
    throw new Error('Failed to parse valid JSON from OpenAI response.');
  }

  return parsedContent as OptimizationResult;
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(req: Request) {
  try {
    const { content, keyword, briefId } = await req.json();

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

    console.log(
      `🔍 Starting content optimization analysis for keyword: "${keyword}"`
    );

    let optimizationResult: OptimizationResult;

    if (briefId) {
      // Use unified approach with conversation context
      const unifiedService = new UnifiedContentService();
      optimizationResult = await unifiedService.optimizeContent(
        content,
        briefId
      );
      console.log('✅ Content analysis complete with context awareness');
    } else {
      // Fallback to legacy approach for backward compatibility
      optimizationResult = await analyzeContentWithWebSearch(content, keyword);
      console.log('✅ Content analysis complete (legacy mode)');
    }

    console.log(
      `📊 Analysis complete. Overall score: ${optimizationResult.overallScore}`
    );

    return NextResponse.json(optimizationResult, {
      headers: {
        'X-Analysis-Method': briefId
          ? 'Unified Context-Aware Analysis'
          : 'Legacy Analysis',
        'X-Overall-Score': optimizationResult.overallScore.toString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error in content optimization endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze content.',
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
