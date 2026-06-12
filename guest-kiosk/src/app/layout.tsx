import { Cormorant_Garamond, IBM_Plex_Mono, Jost } from 'next/font/google';
import './globals.css';
import { KioskProviders } from '@/lib/kiosk-providers';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
});

export const metadata = {
  title: 'The Atelier — Wedding Photobooth',
  description: 'Luxury wedding photobooth guest experience',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-surface-base text-content-primary antialiased">
        <KioskProviders>{children}</KioskProviders>
      </body>
    </html>
  );
}
