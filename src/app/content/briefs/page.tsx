import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ContentBriefsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Content Briefs</h1>
        <p className="text-muted-foreground mt-2">Generate AI-powered content briefs for your target keywords</p>
      </div>

      {/* Input Section */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate Content Briefs</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Keywords</label>
            <textarea
              placeholder="Enter your finalized keywords (one per line)&#10;Example:&#10;live face swap&#10;real-time face swap&#10;AI face swap tool"
              rows={4}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Personas (optional)</label>
            <textarea
              placeholder="Describe your target audience&#10;Example:&#10;YouTube Creators&#10;Social Media Marketers&#10;Online Education Instructors"
              rows={3}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <Button size="lg">Generate Content Briefs</Button>
            <Button variant="outline" size="lg">
              Analyze SERP
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Briefs */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generated Content Briefs</h2>

        <div className="space-y-6">
          {/* Sample Brief 1 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Keyword: live face swap</h3>
              <Button size="sm">Select Brief</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Target</h4>
                <p className="text-sm text-muted-foreground">YouTube Creators</p>
                <h4 className="font-medium text-sm mb-1 mt-2">Intent</h4>
                <p className="text-sm text-muted-foreground">How-to Search</p>
                <h4 className="font-medium text-sm mb-1 mt-2">Topic</h4>
                <p className="text-sm">"How to Set Up Real-time Face Swap on Instagram Live"</p>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Target</h4>
                <p className="text-sm text-muted-foreground">Social Media Marketers</p>
                <h4 className="font-medium text-sm mb-1 mt-2">Intent</h4>
                <p className="text-sm text-muted-foreground">Comparison</p>
                <h4 className="font-medium text-sm mb-1 mt-2">Topic</h4>
                <p className="text-sm">"OBS vs Streamlabs: Real-time Face Swap Feature Comparison"</p>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Target</h4>
                <p className="text-sm text-muted-foreground">Online Education Instructors</p>
                <h4 className="font-medium text-sm mb-1 mt-2">Intent</h4>
                <p className="text-sm text-muted-foreground">Troubleshooting</p>
                <h4 className="font-medium text-sm mb-1 mt-2">Topic</h4>
                <p className="text-sm">"Solving Screen Lag Issues During Live Face Swapping"</p>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-semibold mb-3">Feedback & Refinement</h3>
            <textarea
              placeholder="Add feedback to improve the selected brief...&#10;Example:&#10;Focus more on beginners&#10;Include mobile setup instructions&#10;Add troubleshooting section"
              rows={3}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex gap-2 mt-3">
              <Button size="sm">Apply Feedback</Button>
              <Button variant="outline" size="sm">
                Regenerate Brief
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SERP Analysis */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">SERP Analysis</h2>

        <div className="space-y-4">
          <p className="text-muted-foreground">Top 5 pages analysis for "live face swap":</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Content Types Found</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• How-to guides (60%)</li>
                <li>• Tool comparisons (25%)</li>
                <li>• Software reviews (15%)</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Common Topics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Setup instructions</li>
                <li>• Software recommendations</li>
                <li>• Troubleshooting guides</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Link href="/keywords">
          <Button variant="outline">← Back to Keywords</Button>
        </Link>
        <Link href="/content/outlines">
          <Button variant="outline">Next: Create Outlines →</Button>
        </Link>
      </div>
    </div>
  );
}
