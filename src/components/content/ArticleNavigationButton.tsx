import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ArticleResult } from '@/hooks/use-article-generation';

export function ArticleNavigationButton() {
  const router = useRouter();
  const [hasArticles, setHasArticles] = useState(false);
  const [editingDraft, setEditingDraft] = useState('');
  const [localArticles, setLocalArticles] = useState<ArticleResult[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Check for articles
      const storedArticles = sessionStorage.getItem('generatedArticles');
      const storedDraft = sessionStorage.getItem('finalizedContent');
      const storedOptimization = sessionStorage.getItem('optimizationResult');

      if (storedArticles) {
        try {
          const articles = JSON.parse(storedArticles);
          setLocalArticles(articles);
          setHasArticles(articles.length > 0);
        } catch (e) {
          console.error('Failed to parse articles');
          setHasArticles(false);
        }
      } else {
        setHasArticles(false);
      }

      if (storedDraft) {
        setEditingDraft(storedDraft);
      }

      if (storedOptimization) {
        try {
          setOptimizationResult(JSON.parse(storedOptimization));
        } catch (e) {
          console.error('Failed to parse optimization result');
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePublish = () => {
    if (!hasArticles) {
      alert('Please generate an article first.');
      return;
    }

    // Save current state
    sessionStorage.setItem('finalizedContent', editingDraft);
    sessionStorage.setItem('reviewComplete', 'true');

    // Save articles for restoration
    if (localArticles.length > 0) {
      sessionStorage.setItem(
        'generatedArticles',
        JSON.stringify(localArticles)
      );
    }

    if (optimizationResult) {
      sessionStorage.setItem(
        'contentAnalysisResult',
        JSON.stringify(optimizationResult)
      );
    }

    router.push('/publishing');
  };

  return (
    <Button size="lg" disabled={!hasArticles} onClick={handlePublish}>
      Complete & Publish
      <ArrowRight className="ml-2 w-4 h-4" />
    </Button>
  );
}
