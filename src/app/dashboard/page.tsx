import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome to your SEO content generation workspace
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-lg border">
          <h3 className="mb-2 font-semibold">Start Keyword Research</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Begin by collecting seed keywords and expanding them with AI
          </p>
          <Link href="/keywords">
            <Button>Start Research</Button>
          </Link>
        </div>
        <div className="p-6 rounded-lg border">
          <h3 className="mb-2 font-semibold">Content Planning</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate content briefs and select target audiences
          </p>
          <Link href="/content/briefs">
            <Button>Plan Content</Button>
          </Link>
        </div>

        <div className="p-6 rounded-lg border">
          <h3 className="mb-2 font-semibold">Create Articles</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate complete articles with AI assistance
          </p>
          <Link href="/content/articles">
            <Button>Create Articles</Button>
          </Link>
        </div>
      </div>

      {/* Workflow Status */}
      <div className="p-6 mb-8 rounded-lg border">
        <h3 className="mb-4 font-semibold">Content Generation Workflow</h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold text-black rounded-full bg-secondary">
              1
            </div>
            <div>
              <p className="font-medium">Keyword Strategy Development</p>
              <p className="text-sm text-muted-foreground">
                Input product context → collect seed keywords → expand keywords
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground">
              2
            </div>
            <div>
              <p className="font-medium">Target Audience & Intent Analysis</p>
              <p className="text-sm text-muted-foreground">
                Generate content briefs → select target audiences and intents
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground">
              3
            </div>
            <div>
              <p className="font-medium">Article Creation</p>
              <p className="text-sm text-muted-foreground">
                Generate complete articles → optimize for SEO → review and edit
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex justify-center items-center w-8 h-8 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground">
              4
            </div>
            <div>
              <p className="font-medium">Review & Publishing</p>
              <p className="text-sm text-muted-foreground">
                Use chat interface for improvements → Export to Notion or
                Markdown
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-lg border">
        <h3 className="mb-4 font-semibold">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex gap-3 items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Ready to start your first keyword research</span>
          </div>
          <div className="flex gap-3 items-center text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Project initialized successfully</span>
          </div>
        </div>
      </div>
    </div>
  );
}
