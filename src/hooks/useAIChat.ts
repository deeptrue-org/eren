import { useState } from 'react';
import { ChatMessage, OptimizationResult } from '@/types/content';

export function useAIChat() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (
    content: string,
    targetKeyword: string,
    optimizationContext?: OptimizationResult | null
  ) => {
    if (!currentMessage.trim() || isSending) return null;

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
          targetKeyword,
          optimizationContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, data.chatMessage]);

      return data.updatedContent || null;
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
      return null;
    } finally {
      setIsSending(false);
    }
  };

  const initializeChat = (keyword: string, overallScore: number) => {
    const welcomeMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      message: `Hello! I'm here to help you finalize your content about "${keyword}". Your content scored ${overallScore}/100 overall. Feel free to ask me to make any adjustments - I can help with tone, clarity, SEO optimization, or any other changes you'd like.`,
      timestamp: Date.now(),
    };
    setChatMessages([welcomeMessage]);
  };

  return {
    chatMessages,
    setChatMessages,
    currentMessage,
    setCurrentMessage,
    isSending,
    sendMessage,
    initializeChat,
  };
}
