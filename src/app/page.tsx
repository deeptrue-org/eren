'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container px-4 py-4 mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">EREN</h1>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container px-4 py-16 mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              AI-Powered SEO Content Generator
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Comprehensive SEO content generation platform that automates the
              entire content creation process from keyword research to
              publishing.
            </p>
            <div className="flex gap-x-6 justify-center items-center mt-10">
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/keywords">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container px-4 py-6 mx-auto">
          <div className="text-sm text-center text-muted-foreground">
            <p>© 2025 EREN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
