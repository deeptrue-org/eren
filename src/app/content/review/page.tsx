'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ReviewPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to outlines page since review functionality is now integrated
    console.log('Redirecting to outlines page...');
    router.replace('/content/outlines');
  }, [router]);

  return (
    <div className="container px-4 py-8 mx-auto">
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">
                Redirecting to the integrated content editor...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
