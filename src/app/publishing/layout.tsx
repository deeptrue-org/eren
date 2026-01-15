'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PublishingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
