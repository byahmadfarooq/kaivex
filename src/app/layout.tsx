import type { Metadata } from 'next';
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { DateProvider } from '@/context/DateContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['500', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Kaivex Systems — Personal Operating System',
  description: 'Single-user executive personal operating system for habits, sleep, running, tasks, and LinkedIn pipeline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen antialiased selection:bg-[#FF7A47]/20 selection:text-[#FF7A47] dark:selection:bg-[#FF7A47]/30 dark:selection:text-[#FF7A47] font-sans">
        <ThemeProvider>
          <DateProvider>
            <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
                {children}
              </main>
            </div>
          </DateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
