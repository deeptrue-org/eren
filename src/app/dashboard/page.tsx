import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your SEO content generation workspace</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Start Keyword Research</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Begin by collecting seed keywords and expanding them with AI
          </p>
          <Link href="/keywords">
            <Button>Start Research</Button>
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Content Planning</h3>
          <p className="text-sm text-muted-foreground mb-4">Generate content briefs and select target audiences</p>
          <Link href="/content/briefs">
            <Button>Plan Content</Button>
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Create Content</h3>
          <p className="text-sm text-muted-foreground mb-4">Generate outlines and create SEO-optimized drafts</p>
          <Link href="/content/drafts">
            <Button>Create Content</Button>
          </Link>
        </div>
      </div>

      {/* Workflow Status */}
      <div className="border rounded-lg p-6 mb-8">
        <h3 className="font-semibold mb-4">Content Generation Workflow</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <p className="font-medium">Keyword Strategy Development</p>
              <p className="text-sm text-muted-foreground">
                Input product context → collect seed keywords → expand keywords
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <p className="font-medium">Target Audience & Intent Analysis</p>
              <p className="text-sm text-muted-foreground">
                Generate content briefs → select target audiences and intents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <p className="font-medium">Content Creation</p>
              <p className="text-sm text-muted-foreground">Generate outlines → create drafts → optimize for SEO</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div>
              <p className="font-medium">Review & Publishing</p>
              <p className="text-sm text-muted-foreground">
                Use chat interface for improvements → Export to Notion or Markdown
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Ready to start your first keyword research</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Project initialized successfully</span>
          </div>
        </div>
      </div>
    </div>
  );
}
