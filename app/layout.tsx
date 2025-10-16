import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LargeKite Capital — Independent Finance Consulting',
  description: 'Human-led finance & investment consulting. AI is our tool, not the product.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
