import { NextRequest, NextResponse } from 'next/server';
import { updateProgress, getProgress } from '@/lib/progress-store';
import {
  connectToSpecificBrowser,
  ensureGoogleTrendsTab,
} from '@/lib/keyword-expansion/driver-manager';

// 사용자가 제공한 브라우저 정보로 연결
export async function POST(req: NextRequest) {
  try {
    const { sessionId, browserInfo } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required.' },
        { status: 400 }
      );
    }

    const { debugPort } = browserInfo || {};

    await updateProgress(sessionId, {
      logs: ['🔗 Attempting to connect to your browser...'],
    });

    // 여러 방법으로 연결 시도
    let driver = null;

    // 방법 1: 사용자 제공 디버그 포트
    if (debugPort) {
      try {
        driver = await connectToSpecificBrowser(sessionId, {
          debugPort: parseInt(debugPort),
        });
      } catch (error) {
        console.log(`Failed to connect with port ${debugPort}:`, error);
      }
    }

    // 최종 연결 확인
    if (driver) {
      // Google Trends 탭 준비
      await ensureGoogleTrendsTab(driver, sessionId, 'en');

      await updateProgress(sessionId, {
        captchaDetected: false,
        waitingForUserIntervention: false,
        logs: [
          '✅ Successfully connected to your browser!',
          '🌟 Using your existing browser session.',
          '▶️ Keyword expansion will continue...',
        ],
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      await updateProgress(sessionId, {
        logs: [
          '❌ Could not connect to your browser.',
          '💡 Please check the information you provided.',
          '🔄 Try restarting Chrome with debugging enabled.',
        ],
      });

      return NextResponse.json(
        { error: 'Failed to connect to browser.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in browser connection API:', error);
    return NextResponse.json(
      { error: 'Failed to process browser connection.' },
      { status: 500 }
    );
  }
}

// CAPTCHA 해결 확인 (기존 로직)
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required.' },
        { status: 400 }
      );
    }

    await updateProgress(sessionId, {
      captchaDetected: false,
      waitingForUserIntervention: false,
      logs: ['✅ User confirmed CAPTCHA resolved. Continuing...'],
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating CAPTCHA status:', error);
    return NextResponse.json(
      { error: 'Failed to update CAPTCHA status.' },
      { status: 500 }
    );
  }
}
