import type { Metadata } from 'next';
import './globals.css';
import { DateProvider } from '@/context/DateContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Kaivex — Personal Operating System',
  description: 'Single-user executive personal operating system for habits, sleep, running, tasks, and LinkedIn pipeline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-[#1E826C]/20 selection:text-[#1E826C] dark:selection:bg-[#2DD4BF]/20 dark:selection:text-[#2DD4BF]">
        <ThemeProvider>
          <DateProvider>
            <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
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