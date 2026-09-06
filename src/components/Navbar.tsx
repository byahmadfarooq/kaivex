'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import KaivexLogo from '@/components/KaivexLogo';
import {
  LayoutDashboard,
  CheckSquare,
  Moon,
  Sun,
  Kanban,
  Activity,
  Users,
  Settings,
  Download,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Habits', href: '/habits', icon: CheckSquare },
  { label: 'Sleep', href: '/sleep', icon: Moon },
  { label: 'Tasks', href: '/tasks', icon: Kanban },
  { label: 'Running', href: '/running', icon: Activity },
  { label: 'Pipeline', href: '/pipeline', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Do not render navbar on login page
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date().toISOString().split('T')[0];
        a.download = `kaivex-export-${today}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#EBE3D3]/90 dark:bg-[#0B0F14]/90 backdrop-blur-xl border-b border-[#CFC3AB] dark:border-[#1D2830] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-2 group">
          <KaivexLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#E2DAC8] dark:bg-[#121A21] p-1 rounded-2xl border border-[#CFC3AB] dark:border-[#1D2830] transition-colors">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#EBE3D3] dark:bg-[#17222C] text-[#D9551F] dark:text-[#FF7A47] border border-[#B5A88F] dark:border-[#2B3A46] shadow-sm font-bold'
                    : 'text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D9551F] dark:text-[#FF7A47]' : 'text-current'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & Theme Switcher */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-white bg-[#E2DAC8] dark:bg-[#121A21] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#FF7A47]" /> : <Moon className="w-4 h-4 text-[#D9551F]" />}
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            title="Download full JSON export"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#14181B] dark:text-[#E7ECEC] bg-[#E2DAC8] dark:bg-[#121A21] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>

          {/* Logout / Lock Button */}
          <button
            onClick={handleLogout}
            title="Lock session"
            className="p-2 rounded-xl text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#6B655F] dark:text-[#98A6AD] bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830]"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#FF7A47]" /> : <Moon className="w-4 h-4 text-[#D9551F]" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#14181B] dark:text-[#E7ECEC] bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-[#CFC3AB] dark:border-[#1D2830] bg-[#EBE3D3] dark:bg-[#0B0F14] space-y-1 animate-fadeIn">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-[#E2DAC8] dark:bg-[#121A21] text-[#D9551F] dark:text-[#FF7A47] font-bold border border-[#B5A88F] dark:border-[#2B3A46]'
                    : 'text-[#6B655F] dark:text-[#98A6AD] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D9551F] dark:text-[#FF7A47]' : 'text-current'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#CFC3AB] dark:border-[#1D2830] flex items-center justify-between">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 text-xs font-semibold text-[#14181B] dark:text-[#E7ECEC] py-2 px-3 rounded-xl bg-[#E2DAC8] dark:bg-[#121A21]"
            >
              <Download className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 py-2 px-3 rounded-xl bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Lock War Room</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
