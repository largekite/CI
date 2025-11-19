import './globals.css';
import type { Metadata } from 'next';
import BackButtons from './components/BackButtons';
import FloatingNav from './components/FloatingNav';
import { BRAND_LEGAL } from './lib/brand';
import Link from "next/link";

export const metadata: Metadata = {
  title: 'LargeKiteCapitalIntelligence — Independent Finance & Intelligence Consulting',
  description: 'Human-led finance & investment consulting. AI is our tool, not the product.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
