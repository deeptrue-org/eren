import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  if (process.platform !== 'darwin') {
    return NextResponse.json(
      { error: 'This feature is only available on macOS.' },
      { status: 400 }
    );
  }

  const { startUrl } = (await req.json()) as { startUrl?: string };

  const port = 9222;
  const userDataDir = path.join(os.homedir(), 'eren_chrome_profile');
  const urlToOpen = startUrl || 'https://trends.google.com/trends/';
  const command = `open -na "Google Chrome" --args --remote-debugging-port=${port} --user-data-dir="${userDataDir}" "${urlToOpen}"`;

  try {
    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    console.log('stdout:', stdout);

    if (stderr) {
      console.warn('stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Browser launch command executed.',
    });
  } catch (error) {
    console.error('Failed to launch Chrome:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Unable to find application')) {
      return NextResponse.json(
        {
          error:
            'Google Chrome application not found. Please install it or check the path.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to launch Chrome.', details: errorMessage },
      { status: 500 }
    );
  }
}
