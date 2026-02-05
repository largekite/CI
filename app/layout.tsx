import './globals.css';
import type { Metadata } from 'next';
import BackButtons from './components/BackButtons';
import FloatingNav from './components/FloatingNav';
import { BRAND_LEGAL } from './lib/brand';
import Link from "next/link";

export const metadata: Metadata = {
  title: 'LargeKite Capital — AI Investment Decision Engine',
  description: 'AI That Tells You If an Investment Is Worth It. Analyze properties and investments in seconds. Get real ROI, cashflow, risks, and smart scenarios powered by AI and CFA-led finance models.',
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
