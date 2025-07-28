import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Chrome, AlertTriangle, CheckCircle } from 'lucide-react';

interface BrowserConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (browserInfo: { debugPort?: number }) => void;
  isConnecting: boolean;
}

export function BrowserConnectionDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: BrowserConnectionDialogProps) {
  const [debugPort, setDebugPort] = useState('9222');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleConnect = () => {
    onConnect({ debugPort: parseInt(debugPort) });
  };

  const handleLaunchBrowser = async (url: 'trends' | 'home') => {
    setIsLaunching(true);
    setLaunchStatus({
      type: 'info',
      message: 'Launching new browser instance...',
    });

    const startUrl =
      url === 'trends'
        ? 'https://trends.google.com/trends/'
        : 'https://www.google.com';

    try {
      const response = await fetch('/api/browser/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startUrl }),
      });
      const data = await response.json();

      if (response.ok) {
        setLaunchStatus({
          type: 'success',
          message: 'Browser launched successfully!',
        });
      } else {
        setLaunchStatus({
          type: 'error',
          message: data.error || 'Failed to launch browser.',
        });
      }
    } catch (err) {
      setLaunchStatus({
        type: 'error',
        message: 'An unexpected error occurred.',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setLaunchStatus(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <Chrome className="w-5 h-5" />
            Connect to Browser
          </DialogTitle>
          <DialogDescription>
            Connect using an existing browser instance or launch a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="grid space-y-5">
          <div className="space-y-2">
            <Label>Launch New Instance</Label>
            <div className="grid gap-2">
              <Button
                variant="secondary"
                onClick={() => handleLaunchBrowser('home')}
                disabled={isLaunching}
                size="sm"
              >
                {isLaunching ? 'Launching...' : 'Launch with Google Home'}
              </Button>
            </div>
            {launchStatus && (
              <div className="flex gap-2 items-center p-2 text-xs rounded-md bg-muted">
                {launchStatus.type === 'error' && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                {launchStatus.type === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span
                  className={
                    launchStatus.type === 'error' ? 'text-red-500' : ''
                  }
                >
                  {launchStatus.message}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 text-xs rounded-md border p-2space-y-5 text-muted-foreground">
            <ol className="space-y-1">
              <li>1. Open Google Trends</li>
              <li>2. Go to Explore</li>
              <li>3. Select &quot;Worldwide&quot; as Country</li>
              <li>4. Click &quot;Connect and Start&quot; button</li>
              <li>5. Wait for Searching keywords to complete</li>
            </ol>
          </div>
          <div className="space-y-1 p-2 text-xs rounded-md border border-yellow-500 bg-[rgba(255,223,0,20%)] text-muted-foreground">
            <p>
              🚨 Keep the opened browser active and don&apos;t switch browsers.
            </p>
            <p>⚠️ If you are facing reCaptcha, please solve it to continue.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting || !debugPort}>
            {isConnecting ? 'Connecting...' : 'Connect and Start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
