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
        {/* ======= NAVBAR ======= */}
        <nav className="w-full border-b bg-white">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
            {/* LEFT: Logo */}
            <Link href="/" className="text-lg font-semibold">
              LargeKite Capital
            </Link>

            {/* RIGHT: Navigation links */}
            <div className="flex items-center gap-6">
              <Link
                href="/tools/cfa-summarizer"
                className="text-sm hover:text-blue-600 transition"
              >
               Summarizer
              </Link>
              <Link
              href="/invest"
              className="text-sm font-medium text-slate-700 hover:text-[#14b8a6]"
               >
               Investment Property Finder
              </Link>

            </div>
            
          </div>
        </nav>

        {/* ======= MAIN CONTENT AREA ======= */}
        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
