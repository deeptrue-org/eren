import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

interface PublishRequest {
  content: string;
  title: string;
  keyword?: string;
}

// Initialize Notion client
function getNotionClient() {
  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) {
    throw new Error('NOTION_API_KEY environment variable is not set');
  }
  return new Client({ auth: notionKey });
}

// Convert markdown-like content to Notion blocks
function contentToNotionBlocks(content: string): any[] {
  const lines = content.split('\n').filter((line) => line.trim());
  const blocks: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      // H1 heading
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(2) } }],
        },
      });
    } else if (trimmed.startsWith('## ')) {
      // H2 heading
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(3) } }],
        },
      });
    } else if (trimmed.startsWith('### ')) {
      // H3 heading
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(4) } }],
        },
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet list item
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(2) } }],
        },
      });
    } else if (trimmed.match(/^\d+\. /)) {
      // Numbered list item
      const content = trimmed.replace(/^\d+\. /, '');
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content } }],
        },
      });
    } else if (trimmed.length > 0) {
      // Regular paragraph
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: trimmed } }],
        },
      });
    }
  }

  return blocks;
}

export async function POST(req: Request) {
  try {
    const { content, title, keyword }: PublishRequest = await req.json();

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Content and title are required' },
        { status: 400 }
      );
    }

    // Get Notion configuration from environment
    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      return NextResponse.json(
        { error: 'NOTION_DATABASE_ID environment variable is not set' },
        { status: 500 }
      );
    }

    const notion = getNotionClient();

    // Convert content to Notion blocks
    const blocks = contentToNotionBlocks(content);

    // Create page properties with only the title (required)
    // Add keyword to title if provided to avoid database schema issues
    const titleText = keyword ? `${title} [${keyword}]` : title;

    const properties: any = {
      Title: {
        title: [
          {
            type: 'text',
            text: {
              content: titleText,
            },
          },
        ],
      },
    };

    // Create the page in Notion
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties,
      children: blocks,
    });

    const pageUrl = `https://notion.so/${response.id.replace(/-/g, '')}`;

    console.log(`✅ Successfully published to Notion: ${title}`);

    return NextResponse.json({
      success: true,
      url: pageUrl,
      pageId: response.id,
      message: 'Content published to Notion successfully',
    });
  } catch (error: any) {
    console.error('❌ Error publishing to Notion:', error);

    let errorMessage = 'Failed to publish to Notion';

    if (error.code === 'unauthorized') {
      errorMessage = 'Notion API key is invalid or unauthorized';
    } else if (error.code === 'object_not_found') {
      errorMessage =
        'Notion database not found. Please check NOTION_DATABASE_ID';
    } else if (error.code === 'validation_error') {
      errorMessage = 'Invalid data format for Notion API';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const hasNotionKey = !!process.env.NOTION_API_KEY;
    const hasDatabaseId = !!process.env.NOTION_DATABASE_ID;

    return NextResponse.json({
      status: 'healthy',
      services: {
        notion: hasNotionKey ? 'configured' : 'not configured',
        database: hasDatabaseId ? 'configured' : 'not configured',
      },
      ready: hasNotionKey && hasDatabaseId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
