import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EREN - AI-Powered SEO Content Generator',
  description:
    'Comprehensive SEO content generation platform that automates the entire content creation process from keyword research to publishing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
