import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UrlBadge } from './UrlBadge';

interface UrlInputSectionProps {
  notionUrl: string;
  setNotionUrl: (url: string) => void;
  recentNotionUrls: string[];
  removeUrl: (url: string) => void;
}

export const UrlInputSection = ({
  notionUrl,
  setNotionUrl,
  recentNotionUrls,
  removeUrl,
}: UrlInputSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Context Data</CardTitle>
      <CardDescription>Provide URLs for context extraction.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium">Notion URL</label>
        <Input
          placeholder="https://notion.so/your-page"
          value={notionUrl}
          onChange={(e) => setNotionUrl(e.target.value)}
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {recentNotionUrls.map((url) => (
            <UrlBadge
              key={url}
              url={url}
              onClick={() => setNotionUrl(url)}
              onRemove={() => removeUrl(url)}
            />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);
