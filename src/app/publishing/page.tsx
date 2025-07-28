import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

export default function PublishingPage() {
  const finalContent = `
# The Ultimate Guide to Real-time Face Swapping

Real-time face swapping has exploded in popularity, captivating audiences on platforms like Instagram, TikTok, and YouTube. This guide covers everything from the underlying technology to setting up your first live face swap. 

## Introduction to Face Swapping Technology

We'll explore popular tools like OBS and Streamlabs and offer tips for a seamless, professional broadcast. Whether you're a content creator engaging your audience or a marketer exploring new promotional avenues, this guide is for you.

### How it works
...

### Popular Apps and Tools
...

## Conclusion

According to a 2023 report, the live streaming industry is projected to reach $184.3 billion by 2027.
  `;

  return (
    <>
      <div className="container py-8 mx-auto">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Publish Your Content</CardTitle>
              <CardDescription>
                Your content is ready. Choose a publishing option below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Preview */}
              <div className="p-4 rounded-md border bg-muted">
                <h3 className="mb-2 text-lg font-semibold">Content Preview</h3>
                <pre className="p-4 font-sans text-sm whitespace-pre-wrap bg-white rounded-md dark:bg-gray-900">
                  {finalContent.trim()}
                </pre>
              </div>

              {/* Publishing Options */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Publishing Options
                </h3>
                <RadioGroup defaultValue="notion" className="space-y-4">
                  <div className="flex items-center p-4 rounded-md border">
                    <RadioGroupItem value="notion" id="notion" />
                    <Label htmlFor="notion" className="ml-3">
                      <span className="block font-semibold">
                        Publish to Notion
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Automatically send the content to your Notion workspace.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center p-4 rounded-md border">
                    <RadioGroupItem value="markdown" id="markdown" />
                    <Label htmlFor="markdown" className="ml-3">
                      <span className="block font-semibold">
                        Download as Markdown
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Save the content as a .md file.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center p-4 rounded-md border">
                    <RadioGroupItem value="html" id="html" />
                    <Label htmlFor="html" className="ml-3">
                      <span className="block font-semibold">
                        Download as HTML
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Save the content as a .html file.
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end">
                <Button size="lg">Publish Now</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="container py-8 mx-auto">
        <div className="flex justify-between">
          <Link href="/content/review">
            <Button variant="outline">← Back to Review</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Finish & Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
