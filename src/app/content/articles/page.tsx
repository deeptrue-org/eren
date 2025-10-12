'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  ArticlesPageContent,
  ArticleNavigationButton,
} from '@/components/content';

export default function ArticlesPage() {
  const router = useRouter();

  return (
    <Suspense
      fallback={
        <div className="container px-4 py-8 mx-auto">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      }
    >
      <div className="container px-4 py-8 pb-32 mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Article Creation Studio
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create, optimize, and finalize your articles with AI assistance.
          </p>
        </div>

        <ArticlesPageContent />

        {/* Fixed Footer Navigation */}
        <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
          <div className="container flex gap-4 justify-between items-center mx-auto">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Briefs
            </Button>
            <ArticleNavigationButton />
          </div>
        </div>
      </div>
    </Suspense>
  );
}


