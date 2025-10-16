import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LargeKiteCapitalIntelligence LLC — Independent Finance & Intelligence Consulting',
  description: 'Human-led finance & investment consulting. AI is our tool, not the product.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
