import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EREN - AI-Powered SEO Content Generator',
  description:
    'Comprehensive SEO content generation platform that automates the entire content creation process from keyword research to publishing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background font-sans antialiased">{children}</div>
      </body>
    </html>
  );
}
