import './globals.css';
import type { Metadata } from 'next';
import BackButtons from './components/BackButtons';

export const metadata: Metadata = {
  title: 'LargeKiteCapitalIntelligence — Independent Finance & Intelligence Consulting',
  description: 'Human-led finance & investment consulting. AI is our tool, not the product.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="footer">
          <BackButtons />
          <div className="fineprint">© {new Date().getFullYear()} LargeKiteCapitalIntelligence LLC</div>
        </footer>
      </body>
    </html>
  );
}
