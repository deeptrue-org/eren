import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function KeywordsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Keyword Research</h1>
        <p className="text-muted-foreground mt-2">
          Start by collecting seed keywords and expanding them with AI-powered analysis
        </p>
      </div>

      {/* Step 1: Seed Keywords */}
      <div className="border rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            1
          </div>
          <h2 className="text-xl font-semibold">Seed Keyword Collection</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Basic Context Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product/Service URL</label>
                <input
                  type="url"
                  placeholder="https://your-website.com"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notion Page URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://notion.so/your-page"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Manual Seed Keywords</h3>
            <textarea
              placeholder="Enter your seed keywords (one per line)&#10;Example:&#10;SEO content generator&#10;AI writing tool&#10;keyword research"
              rows={6}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <h3 className="font-medium mb-3">Exclude Keywords (optional)</h3>
            <textarea
              placeholder="Enter keywords to exclude (one per line)&#10;Example:&#10;free&#10;cheap&#10;competitor-name"
              rows={3}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <Button size="lg">Collect Seed Keywords</Button>
            <Button variant="outline" size="lg">
              Import from Google Search Console
            </Button>
          </div>
        </div>
      </div>

      {/* Step 2: Expand Keywords */}
      <div className="border rounded-lg p-6 mb-8 opacity-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold">
            2
          </div>
          <h2 className="text-xl font-semibold">Keyword Expansion</h2>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Complete Step 1 to unlock keyword expansion using Google Trends and Google Suggest API
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Related Keywords</h4>
              <p className="text-sm text-muted-foreground">AI-powered keyword expansion using Google Trends</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Search Volume</h4>
              <p className="text-sm text-muted-foreground">Get estimated search volumes for better prioritization</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Intent Analysis</h4>
              <p className="text-sm text-muted-foreground">Understand user intent behind each keyword</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Finalize Strategy */}
      <div className="border rounded-lg p-6 opacity-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold">
            3
          </div>
          <h2 className="text-xl font-semibold">Finalize Keyword Strategy</h2>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">Review and select your final keyword list (5-10 keywords recommended)</p>
          <div className="flex gap-4">
            <Button disabled>Proceed to Content Planning</Button>
            <Link href="/content/briefs">
              <Button variant="outline" disabled>
                Skip to Content Briefs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Link href="/dashboard">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
        <Link href="/content/briefs">
          <Button variant="outline">Next: Content Planning →</Button>
        </Link>
      </div>
    </div>
  );
}
