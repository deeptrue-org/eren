export interface ArticleSection {
  id: string;
  title: string;
  level: 'H1' | 'H2' | 'H3';
  wordCount: number;
  keywords?: string[];
  children: ArticleSection[];
}

export interface Article {
  id: string;
  briefId: string;
  keyword: string;
  title: string;
  content: string;
  wordCount: number;
  sections?: ArticleSection[];
  internalNotes?: string[];
}

export interface OptimizationResult {
  seo: {
    overallScore: number;
    keywordDensity: {
      keyword: string;
      count: number;
      density: number;
      recommendation: string;
    };
    metaDescription: {
      length: number;
      isOptimal: boolean;
      recommendation: string;
    };
    titleTags: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
      recommendation: string;
    };
    imageAltTags: {
      missingCount: number;
      suggestions: string[];
    };
    keywordPlacement: {
      inTitle: boolean;
      inFirstParagraph: boolean;
      inSubheadings: number;
      recommendation: string;
    };
  };
  factCheck: {
    verifiedCount: number;
    totalClaims: number;
    facts: {
      claim: string;
      isVerified: boolean;
      source?: string;
      confidence: number;
    }[];
    suggestions: {
      claim: string;
      suggestedSource: string;
      reason: string;
    }[];
  };
  readability: {
    clarityScore: number;
    sentenceLength: {
      average: number;
      isOptimal: boolean;
      recommendation: string;
    };
    passiveVoice: {
      count: number;
      percentage: number;
      suggestions: string[];
    };
    grammar: {
      errorCount: number;
      errors: {
        text: string;
        suggestion: string;
        position: number;
      }[];
    };
    tone: {
      detected: string;
      consistency: number;
      recommendation: string;
    };
    complexity: {
      score: number;
      recommendation: string;
    };
  };
  overallScore: number;
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: number;
}
