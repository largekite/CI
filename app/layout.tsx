import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LargeKite Capital — Independent Finance Consulting',
  description: 'Human-led finance & investment consulting. AI is our tool, not the product.',
  metadataBase: new URL('https://www.largekitecapital.com'),
  openGraph: {
    title: 'LargeKite Capital',
    description: 'Finance-first consulting. AI assists; humans decide.',
    url: 'https://www.largekitecapital.com',
    siteName: 'LargeKite Capital',
    locale: 'en_US',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'LargeKite Capital',
              url: 'https://www.largekitecapital.com',
              description: 'Independent finance & investment consulting. AI assists analysis.',
              areaServed: 'US',
              founder: 'Zheng Liu',
              sameAs: ['https://www.linkedin.com']
            })
          }}
        />
      </body>
    </html>
  );
}
