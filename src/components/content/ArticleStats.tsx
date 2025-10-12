import { ArticleResult } from '@/hooks/use-article-generation';

interface ArticleStatsProps {
  articles: ArticleResult[];
}

export function ArticleStats({ articles }: ArticleStatsProps) {
  const totalWordCount = articles.reduce(
    (sum, article) => sum + article.wordCount,
    0
  );
  const averageWordCount =
    articles.length > 0 ? Math.round(totalWordCount / articles.length) : 0;

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold text-primary">{articles.length}</div>
        <div className="text-sm text-muted-foreground">Articles</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {totalWordCount.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">Total Words</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {averageWordCount.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">Avg Words</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {articles.filter((article) => article.wordCount > 0).length}
        </div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </div>
    </div>
  );
}
