import './globals.css';
import type { Metadata } from 'next';
import BackButtons from './components/BackButtons';
import FloatingNav from './components/FloatingNav';
import { BRAND_LEGAL } from './lib/brand';

export const metadata: Metadata = {
  title: 'LargeKiteCapitalIntelligence — Independent Finance & Intelligence Consulting',
  description: 'Human-led finance & investment consulting. AI is our tool, not the product.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <FloatingNav />
        <footer className="footer">
          <BackButtons />
          <div className="fineprint">© {new Date().getFullYear()} {BRAND_LEGAL}</div>
        </footer>
      </body>
    </html>
  );
}
