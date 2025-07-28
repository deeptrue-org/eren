import { NextResponse } from 'next/server';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: number;
}

export interface FeedbackRequest {
  content: string;
  userFeedback: string;
  chatHistory: ChatMessage[];
  targetKeyword: string;
  optimizationContext?: any;
}

export interface FeedbackResponse {
  aiResponse: string;
  updatedContent?: string;
  suggestions: string[];
  chatMessage: ChatMessage;
}

// Rate limiting
const requestTracker = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const window = 60000; // 1 minute
  const maxRequests = 20; // More requests allowed for chat

  const record = requestTracker.get(identifier);

  if (!record || now > record.resetTime) {
    requestTracker.set(identifier, { count: 1, resetTime: now + window });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// AI 응답에서 JSON만 안전하게 추출 (Improved version)
function extractJsonFromString(text: string): string | null {
  // Case 1: AI wraps the JSON in markdown
  let jsonText: string | null = null;
  const markdownMatch = text.match(/```json\s*(\{[\s\S]*\})\s*```/s);
  if (markdownMatch && markdownMatch[1]) {
    jsonText = markdownMatch[1];
  } else {
    // Case 2: AI response is just the JSON object, maybe with surrounding text
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonText = text.substring(startIndex, endIndex + 1);
    }
  }

  if (!jsonText) {
    return null;
  }

  // Sanitize the JSON string to escape unescaped newlines in string values.
  // This is a robust way to handle LLM-generated JSON that might contain raw newlines.
  let sanitized = '';
  let inString = false;

  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i];
    const wasInString = inString;

    if (char === '"') {
      let escapeCount = 0;
      let j = i - 1;
      while (j >= 0 && jsonText[j] === '\\') {
        escapeCount++;
        j--;
      }
      if (escapeCount % 2 === 0) {
        inString = !inString;
      }
    }

    if (wasInString && char === '\n') {
      sanitized += '\\n';
    } else {
      sanitized += char;
    }
  }

  return sanitized;
}

// GPT를 통한 피드백 처리
async function processUserFeedback(
  content: string,
  userFeedback: string,
  chatHistory: ChatMessage[],
  targetKeyword: string,
  optimizationContext?: any
): Promise<{
  aiResponse: string;
  updatedContent?: string;
  suggestions: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      aiResponse:
        'I understand your feedback. However, AI features are not currently available. Please manually apply the changes you mentioned.',
      suggestions: ['Manual editing required', 'AI assistance unavailable'],
    };
  }

  try {
    // 채팅 히스토리를 컨텍스트로 구성
    const historyContext = chatHistory
      .slice(-6) // 최근 6개 메시지만 사용
      .map((msg) => `${msg.sender}: ${msg.message}`)
      .join('\n');

    const optimizationInfo = optimizationContext
      ? `
Previous optimization analysis:
- SEO Score: ${optimizationContext.seo?.overallScore || 'N/A'}
- Readability Score: ${optimizationContext.readability?.clarityScore || 'N/A'}
- Key improvements needed: ${
          optimizationContext.suggestions?.slice(0, 3).join(', ') ||
          'None specified'
        }
`
      : '';

    const prompt = `You are an expert content editor and writing assistant. 

CURRENT CONTENT:
${content}

TARGET KEYWORD: ${targetKeyword}

CHAT HISTORY:
${historyContext}

${optimizationInfo}

USER FEEDBACK: ${userFeedback}

IMPORTANT: If the user is asking for ANY changes to the content (tone, style, corrections, additions, etc.), you MUST provide the complete updated content. Even for simple requests like "make it friendly" or "fix grammar", provide the fully revised content.

Based on the user's feedback, please:
1. Provide a helpful response addressing their request
2. **ALWAYS provide the updated content when user requests changes** - rewrite the entire content incorporating their feedback
3. Give 2-3 specific suggestions for further improvement

Respond in JSON format:
{
  "aiResponse": "Your conversational response to the user",
  "updatedContent": "The complete revised content (ALWAYS provide this when user requests changes)",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Guidelines:
- Be conversational and helpful
- For tone changes: Rewrite the ENTIRE content with the new tone
- For error fixes: Provide the COMPLETE corrected version
- For additions: Provide the FULL content with additions incorporated
- For clarification requests: Still provide improved content if possible
- Keep responses concise but thorough
- Maintain SEO optimization while making changes
- NEVER return null for updatedContent if user requested any content modification`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional content editor and writing assistant. Provide helpful, actionable feedback and make precise edits based on user requests.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponseContent = data.choices[0]?.message?.content;

    if (!aiResponseContent) {
      throw new Error('No response from AI');
    }

    const jsonString = extractJsonFromString(aiResponseContent);

    if (!jsonString) {
      // If we can't find JSON, it might be a conversational response.
      // We return it directly to the user instead of a canned fallback.
      return {
        aiResponse: aiResponseContent,
        suggestions: [
          "I couldn't find structured data in the response. You can try rephrasing your request.",
        ],
      };
    }

    const result = JSON.parse(jsonString);

    return {
      aiResponse:
        result.aiResponse ||
        'I have processed your request. Please see the results.',
      updatedContent: result.updatedContent || undefined,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('Error in feedback processing:', error);
    // A single, more informative catch block
    return {
      aiResponse: `I'm sorry, I encountered an error while processing your request. Please try rephrasing, or try again later. (Error: ${
        error instanceof Error ? error.message : 'Unknown error'
      })`,
      suggestions: ['Please try again', 'Try rephrasing your feedback'],
    };
  }
}

export async function POST(req: Request) {
  try {
    const {
      content,
      userFeedback,
      chatHistory,
      targetKeyword,
      optimizationContext,
    }: FeedbackRequest = await req.json();

    if (!content || !userFeedback) {
      return NextResponse.json(
        { error: 'Content and user feedback are required.' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    console.log(
      `💬 Processing user feedback: "${userFeedback.substring(0, 50)}..."`
    );

    // Process feedback with AI
    const { aiResponse, updatedContent, suggestions } =
      await processUserFeedback(
        content,
        userFeedback,
        chatHistory || [],
        targetKeyword,
        optimizationContext
      );

    // Create chat message
    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: 'ai',
      message: aiResponse,
      timestamp: Date.now(),
    };

    const response: FeedbackResponse = {
      aiResponse,
      updatedContent,
      suggestions,
      chatMessage,
    };

    console.log(`✅ Feedback processed. Content updated: ${!!updatedContent}`);

    return NextResponse.json(response, {
      headers: {
        'X-Feedback-Processed': 'true',
        'X-Content-Updated': updatedContent ? 'true' : 'false',
        'X-Suggestions-Count': suggestions.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error in feedback processing:', error);

    return NextResponse.json(
      {
        error: 'Failed to process feedback.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: 'healthy',
    services: {
      ai: hasOpenAI ? 'GPT-4-available' : 'fallback-only',
      chat: 'active',
      feedback: 'active',
    },
    timestamp: new Date().toISOString(),
  });
}
