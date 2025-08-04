'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Chrome, ExternalLink, Info, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface BrowserStatus {
  isDetected: boolean;
  hasGoogleTrends: boolean;
  tabCount: number;
  isChecking: boolean;
}

// Custom hook for browser status
function useBrowserStatus() {
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({
    isDetected: false,
    hasGoogleTrends: false,
    tabCount: 0,
    isChecking: false,
  });

  const checkBrowserStatus = async () => {
    setBrowserStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      const response = await fetch('http://localhost:9222/json/version').catch(
        () => null
      );
      if (!response) {
        setBrowserStatus({
          isDetected: false,
          hasGoogleTrends: false,
          tabCount: 0,
          isChecking: false,
        });
        return;
      }

      const tabsResponse = await fetch('http://localhost:9222/json');
      const tabs = await tabsResponse.json();

      const trendsTabs = tabs.filter(
        (tab: any) =>
          tab.url &&
          tab.url.includes('trends.google.com') &&
          tab.type === 'page'
      );

      setBrowserStatus({
        isDetected: true,
        hasGoogleTrends: trendsTabs.length > 0,
        tabCount: tabs.length,
        isChecking: false,
      });
    } catch (error) {
      setBrowserStatus({
        isDetected: false,
        hasGoogleTrends: false,
        tabCount: 0,
        isChecking: false,
      });
    }
  };

  return { browserStatus, checkBrowserStatus };
}

export function ChromeSetupHelper() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { browserStatus, checkBrowserStatus } = useBrowserStatus();

  const openGoogleTrends = () => {
    window.open(
      'https://trends.google.com/',
      '_blank',
      'width=1200,height=800'
    );
  };

  useEffect(() => {
    if (isExpanded) {
      checkBrowserStatus();
    }
  }, [isExpanded]);

  return (
    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Chrome className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
              🚀 Enhanced Mode
              {browserStatus.isDetected ? (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-200">
                  ✅ Chrome Detected
                </span>
              ) : (
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full dark:bg-gray-800 dark:text-gray-400">
                  Not Connected
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            {isExpanded && (
              <Button
                variant="outline"
                size="sm"
                onClick={checkBrowserStatus}
                disabled={browserStatus.isChecking}
                className="text-xs h-7 px-2"
              >
                {browserStatus.isChecking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  '🔄 Check Status'
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Info className="mr-1 w-4 h-4" />
              {isExpanded ? 'Hide' : 'Show'} Setup
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <CardDescription className="text-sm text-blue-700 dark:text-blue-300">
            Use your existing Chrome browser for better performance and fewer
            blocks!
          </CardDescription>

          {isExpanded && browserStatus.isDetected && (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-700 dark:text-green-300">
                📊 {browserStatus.tabCount} tabs open
              </span>
              {browserStatus.hasGoogleTrends ? (
                <span className="text-green-700 dark:text-green-300">
                  ✅ Google Trends found
                </span>
              ) : (
                <span className="text-orange-700 dark:text-orange-300">
                  ⚠️ Google Trends not open
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Quick Setup */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-mono">
                  OPTION 1
                </span>
                Quick Setup (Recommended)
              </h4>
              <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>Open Google Trends:</strong>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openGoogleTrends}
                      className="ml-2 h-6 px-2 text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open Trends
                    </Button>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong>Stay logged in</strong> to your Google account in
                    that tab
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong>Keep the tab open</strong> and start keyword
                    expansion below
                  </span>
                </li>
              </ol>
            </div>

            {/* Advanced Setup */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-mono">
                  OPTION 2
                </span>
                Advanced Setup (Maximum Performance)
              </h4>
              <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>Close all Chrome windows completely</strong>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong>Start Chrome with debugging:</strong>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded border font-mono text-xs overflow-x-auto">
                      <div className="mb-1 text-gray-600 dark:text-gray-400">
                        # macOS:
                      </div>
                      <div className="text-green-600 dark:text-green-400">
                        /Applications/Google\ Chrome.app/Contents/MacOS/Google\
                        Chrome --remote-debugging-port=9222
                      </div>
                      <div className="mt-2 mb-1 text-gray-600 dark:text-gray-400">
                        # Windows:
                      </div>
                      <div className="text-green-600 dark:text-green-400">
                        "C:\Program Files\Google\Chrome\Application\chrome.exe"
                        --remote-debugging-port=9222
                      </div>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong>Open Google Trends</strong> in the new Chrome window
                    and log in
                  </div>
                </li>
              </ol>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <h5 className="font-semibold text-green-800 dark:text-green-200 text-sm mb-2">
                ✅ Benefits of Enhanced Mode:
              </h5>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• Uses your existing logged-in Google session</li>
                <li>• Significantly reduces CAPTCHA occurrences</li>
                <li>• Faster keyword extraction</li>
                <li>• Better success rates for large keyword lists</li>
                <li>• You can monitor the process in real-time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
