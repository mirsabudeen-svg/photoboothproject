import { Cormorant_Garamond, IBM_Plex_Mono, Jost } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { PostHogProvider } from '@/lib/posthog';

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
  title: 'Photobooth Admin',
  description: 'Luxury event photobooth operations dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <PostHogProvider>
          <AppShell>{children}</AppShell>
        </PostHogProvider>
      </body>
    </html>
  );
}
