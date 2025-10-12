import { useState, useEffect } from 'react';
import { ContentBrief } from '@/lib/types';
import { ArticleResult } from './use-article-generation';

export function useSessionStorage() {
  const [selectedBrief, setSelectedBrief] = useState<ContentBrief | null>(null);
  const [localArticles, setLocalArticles] = useState<ArticleResult[]>([]);

  const enhanceBriefWithExpandedKeywords = (
    brief: ContentBrief,
    expandedKeywords: any
  ): ContentBrief => {
    const allExpandedKeywords: string[] = [];
    if (expandedKeywords && typeof expandedKeywords === 'object') {
      Object.values(expandedKeywords).forEach((keywords: any) => {
        if (Array.isArray(keywords)) {
          keywords.forEach((kw: any) => {
            if (kw.keyword && !allExpandedKeywords.includes(kw.keyword)) {
              allExpandedKeywords.push(kw.keyword);
            }
          });
        }
      });
    }

    return {
      ...brief,
      relatedKeywords: allExpandedKeywords
        .filter(
          (kw) =>
            kw !== brief.keyword &&
            kw.toLowerCase().includes(brief.keyword.toLowerCase().split(' ')[0])
        )
        .slice(0, 10),
    };
  };

  const loadSelectedBrief = (): ContentBrief | null => {
    try {
      const stored = sessionStorage.getItem('selectedBrief');
      if (!stored) return null;

      let brief = JSON.parse(stored) as ContentBrief;
      const expandedKeywordsStored = sessionStorage.getItem('expandedKeywords');

      if (expandedKeywordsStored && brief) {
        try {
          const expandedKeywords = JSON.parse(expandedKeywordsStored);
          brief = enhanceBriefWithExpandedKeywords(brief, expandedKeywords);
        } catch (e) {
          console.warn(
            'Failed to parse expanded keywords, continuing without them:',
            e
          );
        }
      }

      setSelectedBrief(brief);
      return brief;
    } catch (e) {
      console.error('Failed to load selected briefs:', e);
      return null;
    }
  };

  const checkExistingArticles = (): ArticleResult[] | null => {
    try {
      const savedArticles = sessionStorage.getItem('generatedArticles');
      if (!savedArticles) return null;

      const articles = JSON.parse(savedArticles);
      const savedDraft = sessionStorage.getItem('finalizedContent');

      if (savedDraft) {
        return articles.map((article: any) => ({
          ...article,
          content: savedDraft,
        }));
      }

      // Apply per-article local drafts if present
      return articles.map((article: any) => {
        const savedDraftForArticle = localStorage.getItem(
          `draft-${article.id}`
        );
        return savedDraftForArticle
          ? { ...article, content: savedDraftForArticle }
          : article;
      });
    } catch (e) {
      console.warn('Failed to restore articles:', e);
      return null;
    }
  };

  useEffect(() => {
    // Load brief first
    const brief = loadSelectedBrief();

    // Then restore articles (independent of brief to handle refresh)
    const existingArticles = checkExistingArticles();
    if (existingArticles && existingArticles.length > 0) {
      // Check if the articles match the current brief
      if (brief && existingArticles[0]?.keyword !== brief.keyword) {
        // Different brief selected, clear previous articles
        clearArticleStorage();
        setLocalArticles([]);
      } else {
        setLocalArticles(existingArticles);
      }
    }
  }, []);

  const clearArticleStorage = () => {
    sessionStorage.removeItem('generatedArticles');
    sessionStorage.removeItem('finalizedContent');
    sessionStorage.removeItem('activeArticle');
    sessionStorage.removeItem('optimizationResult');

    // Clear any saved drafts
    localArticles.forEach((article) => {
      localStorage.removeItem(`draft-${article.id}`);
    });
  };

  const saveArticles = (articles: ArticleResult[]) => {
    sessionStorage.setItem('generatedArticles', JSON.stringify(articles));
    setLocalArticles(articles);
  };

  const saveActiveArticle = (articleId: string) => {
    const activeArticle = localArticles.find((a) => a.id === articleId);
    if (activeArticle) {
      sessionStorage.setItem(
        'activeArticle',
        JSON.stringify({ id: articleId })
      );
    }
  };

  return {
    selectedBrief,
    localArticles,
    setLocalArticles,
    clearArticleStorage,
    saveArticles,
    saveActiveArticle,
  };
}
