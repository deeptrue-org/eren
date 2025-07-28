import { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  MessageCircle,
  RefreshCw,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Change, diffLines } from 'diff';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: number;
}

interface OptimizationResult {
  seo: { overallScore: number };
  readability: { clarityScore: number };
  factCheck: { verifiedCount: number; totalClaims: number };
  overallScore: number;
  suggestions: string[];
  improvedContent?: string;
}

interface ReviewSectionProps {
  content: string;
  keyword: string;
  optimizationResult?: OptimizationResult;
  onContentChange: (content: string) => void;
  onHasChanges: (hasChanges: boolean) => void;
  onSuggestedContent: (content: string | null) => void;
}

interface ChangeHunk {
  id: number;
  changes: Change[];
  status: 'pending' | 'accepted' | 'rejected';
}

function InlineDiffEditor({
  original,
  suggestion,
  onApply,
  onCancel,
}: {
  original: string;
  suggestion: string;
  onApply: (newContent: string) => void;
  onCancel: () => void;
}) {
  const hunks = useMemo(() => {
    const diffs = diffLines(original, suggestion);
    const groupedHunks: ChangeHunk[] = [];
    let currentHunk: Change[] = [];
    let hunkId = 0;

    diffs.forEach((change: Change) => {
      if (!change.added && !change.removed) {
        if (currentHunk.length > 0) {
          const removedString = currentHunk
            .filter((c) => c.removed)
            .map((c) => c.value)
            .join('');
          const addedString = currentHunk
            .filter((c) => c.added)
            .map((c) => c.value)
            .join('');
          const isWhitespaceChange =
            removedString.trim() === addedString.trim();

          groupedHunks.push({
            id: hunkId++,
            changes: currentHunk,
            status: isWhitespaceChange ? 'accepted' : 'pending',
          });
          currentHunk = [];
        }
        groupedHunks.push({
          id: hunkId++,
          changes: [change],
          status: 'accepted',
        });
      } else {
        currentHunk.push(change);
      }
    });

    if (currentHunk.length > 0) {
      const removedString = currentHunk
        .filter((c) => c.removed)
        .map((c) => c.value)
        .join('');
      const addedString = currentHunk
        .filter((c) => c.added)
        .map((c) => c.value)
        .join('');
      const isWhitespaceChange = removedString.trim() === addedString.trim();
      groupedHunks.push({
        id: hunkId++,
        changes: currentHunk,
        status: isWhitespaceChange ? 'accepted' : 'pending',
      });
    }

    return groupedHunks;
  }, [original, suggestion]);

  const [processedHunks, setProcessedHunks] = useState(hunks);

  const handleHunkDecision = (
    hunkId: number,
    decision: 'accepted' | 'rejected' | 'pending'
  ) => {
    setProcessedHunks((prev) =>
      prev.map((hunk) =>
        hunk.id === hunkId ? { ...hunk, status: decision } : hunk
      )
    );
  };

  const handleApplyChanges = () => {
    const newContent = processedHunks
      .map((hunk) => {
        if (hunk.status === 'accepted') {
          return hunk.changes
            .filter((c) => !c.removed)
            .map((c) => c.value)
            .join('');
        }
        return hunk.changes
          .filter((c) => !c.added)
          .map((c) => c.value)
          .join('');
      })
      .join('');
    onApply(newContent);
  };

  const handleSelectAll = (decision: 'accepted' | 'rejected') => {
    setProcessedHunks(
      hunks.map((h) => ({
        ...h,
        status: h.changes.some((c) => c.added || c.removed)
          ? decision
          : 'accepted',
      }))
    );
  };

  const pendingCount = processedHunks.filter(
    (h) => h.status === 'pending'
  ).length;

  return (
    <div className="border rounded-md min-h-[400px] flex flex-col">
      <div className="flex justify-between items-center p-2 border-b bg-muted/50">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectAll('accepted')}
          >
            <Check className="mr-1 w-4 h-4" /> Accept All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectAll('rejected')}
          >
            <X className="mr-1 w-4 h-4" /> Reject All
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          {pendingCount > 0 && (
            <span className="text-sm animate-pulse text-muted-foreground">
              {pendingCount} pending changes
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApplyChanges}>
            Apply Changes
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-4 font-mono text-sm">
        {processedHunks.map((hunk) => {
          const isChangeHunk = hunk.changes.some((c) => c.added || c.removed);

          if (!isChangeHunk) {
            return (
              <pre key={hunk.id} className="font-mono whitespace-pre-wrap">
                {hunk.changes[0].value}
              </pre>
            );
          }

          return (
            <div
              key={hunk.id}
              className={`border rounded-md overflow-hidden my-2 ${
                hunk.status === 'accepted'
                  ? 'border-green-500/50'
                  : hunk.status === 'rejected'
                  ? 'border-red-500/50'
                  : 'border-blue-500/50'
              }`}
            >
              <div className="flex gap-2 justify-end items-center p-2 bg-muted/20">
                {hunk.status === 'pending' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHunkDecision(hunk.id, 'accepted')}
                    >
                      <Check className="mr-1 w-4 h-4" /> Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHunkDecision(hunk.id, 'rejected')}
                    >
                      <X className="mr-1 w-4 h-4" /> Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHunkDecision(hunk.id, 'pending')}
                  >
                    <RefreshCw className="mr-1 w-3 h-3" /> Revert
                  </Button>
                )}
              </div>
              <div
                className={`p-4 ${
                  hunk.status === 'accepted'
                    ? 'bg-green-500/10'
                    : hunk.status === 'rejected'
                    ? 'bg-red-500/10'
                    : ''
                }`}
              >
                {hunk.changes.map((change, index) => {
                  const style = change.added
                    ? { background: 'rgba(46, 160, 67, 0.15)' }
                    : change.removed
                    ? {
                        background: 'rgba(248, 81, 73, 0.15)',
                        textDecoration: 'line-through',
                      }
                    : {};
                  return (
                    <pre
                      key={index}
                      className="font-mono whitespace-pre-wrap"
                      style={style}
                    >
                      {change.value}
                    </pre>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewSection({
  content,
  keyword,
  optimizationResult,
  onContentChange,
  onHasChanges,
  onSuggestedContent,
}: ReviewSectionProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with AI greeting
  useEffect(() => {
    if (chatMessages.length === 0 && keyword) {
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        message: `Hello! I'm here to help you finalize your content about "${keyword}". ${
          optimizationResult
            ? `Your content scored ${optimizationResult.overallScore}/100 overall.`
            : ''
        } Feel free to ask me to make any adjustments - I can help with tone, clarity, SEO optimization, or any other changes you'd like.`,
        timestamp: Date.now(),
      };

      setChatMessages([welcomeMessage]);

      // If there's improved content from optimization, offer it
      if (
        optimizationResult?.improvedContent &&
        optimizationResult.improvedContent !== content
      ) {
        const improvementMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          message:
            'I also have an improved version of your content based on the optimization analysis. Would you like me to show you the improvements?',
          timestamp: Date.now() + 1,
        };
        setTimeout(() => {
          setChatMessages((prev) => [...prev, improvementMessage]);
        }, 1000);
      }
    }
  }, [keyword, optimizationResult, content, chatMessages.length]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Update parent when changes occur
  useEffect(() => {
    onHasChanges(hasChanges);
  }, [hasChanges, onHasChanges]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      message: currentMessage.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/content/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          userFeedback: userMessage.message,
          chatHistory: chatMessages,
          targetKeyword: keyword,
          optimizationContext: optimizationResult,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Debug: Log the full response
      console.log('🔍 AI Response Data:', data);
      console.log('📝 Updated Content:', data.updatedContent);
      console.log('🆚 Content Comparison:', {
        original: content.trim().substring(0, 100),
        updated: data.updatedContent?.trim().substring(0, 100),
        same: data.updatedContent?.trim() === content.trim(),
      });

      // Add AI response to chat
      setChatMessages((prev) => [...prev, data.chatMessage]);

      // Update content if AI provided changes
      if (
        data.updatedContent &&
        data.updatedContent.trim() !== content.trim()
      ) {
        console.log(
          '✅ Setting suggested content:',
          data.updatedContent.substring(0, 200)
        );
        // Store suggested content for review
        onSuggestedContent(data.updatedContent);

        // Add a follow-up message about the update
        const updateMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          message:
            "✅ I've prepared some improvements for you. Please review the changes below the content editor and decide whether to apply them.",
          timestamp: Date.now() + 1,
        };
        setTimeout(() => {
          setChatMessages((prev) => [...prev, updateMessage]);
        }, 500);
      } else {
        console.log('❌ No updated content provided or content is the same');
        if (!data.updatedContent) {
          console.log('   - No updatedContent in response');

          // If user clearly asked for changes but no updated content provided
          if (
            userMessage.message.toLowerCase().includes('make') ||
            userMessage.message.toLowerCase().includes('change') ||
            userMessage.message.toLowerCase().includes('fix') ||
            userMessage.message.toLowerCase().includes('improve')
          ) {
            const clarificationMessage: ChatMessage = {
              id: `msg-${Date.now() + 2}`,
              sender: 'ai',
              message:
                "I understand your request, but I wasn't able to generate the revised content this time. Could you please be more specific about what you'd like me to change? For example: 'Make the introduction more friendly' or 'Add more details about the benefits'.",
              timestamp: Date.now() + 2,
            };
            setTimeout(() => {
              setChatMessages((prev) => [...prev, clarificationMessage]);
            }, 1000);
          }
        } else {
          console.log('   - Content is identical');
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        message:
          'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const applyImprovedContent = () => {
    if (
      optimizationResult?.improvedContent &&
      optimizationResult.improvedContent !== content
    ) {
      // Store improved content for review
      onSuggestedContent(optimizationResult.improvedContent);

      const confirmMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        message:
          'I have an improved version ready. Please review the changes below the content editor.',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, confirmMessage]);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* AI Chat Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <MessageCircle className="w-4 h-4" />
            AI Assistant
          </CardTitle>
          <CardDescription>Chat for improvements and feedback.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Chat Messages */}
          <div className="p-4 max-h-[300px] overflow-y-auto">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.message}</div>
                    <div className="mt-1 text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 items-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="px-3 py-2 rounded-lg bg-muted">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="Ask for changes or improvements..."
                className="resize-none min-h-[50px] flex-1"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isSending}
                size="sm"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Try: "Make it professional", "Fix grammar", "Make shorter"
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
