'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Clock } from 'lucide-react';

interface LogEntry {
  message: string;
  timestamp: string;
  type?: 'log' | 'error' | 'complete';
}

interface RealTimeLogsProps {
  logs: LogEntry[];
  isActive: boolean;
  title?: string;
}

export function RealTimeLogs({
  logs,
  isActive,
  title = 'Generation Progress',
}: RealTimeLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogColor = (message: string) => {
    if (message.includes('❌')) return 'text-red-600';
    if (message.includes('✅')) return 'text-green-600';
    if (message.includes('🚀')) return 'text-blue-600';
    if (message.includes('🎉')) return 'text-purple-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex gap-2 items-center text-sm">
          <Terminal className="w-4 h-4" />
          {title}
          {isActive && (
            <Badge variant="secondary" className="animate-pulse">
              Processing...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="overflow-y-auto p-3 h-64 font-mono text-xs rounded-md bg-slate-50 dark:bg-slate-900"
        >
          {logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Waiting for process to start...
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex flex-shrink-0 gap-1 items-center min-w-0 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.timestamp)}
                  </div>
                  <div className={`flex-1 ${getLogColor(log.message)}`}>
                    {log.message}
                  </div>
                </div>
              ))}
              {isActive && (
                <div className="flex gap-2 items-center text-blue-600 animate-pulse">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
