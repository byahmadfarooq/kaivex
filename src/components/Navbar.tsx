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
    <header className="sticky top-0 z-40 w-full bg-[#F5F2EB]/90 dark:bg-[#090C11]/85 backdrop-blur-xl border-b border-[#E2DDD5] dark:border-[#20293A] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand with Rhythm Waves */}
        <Link href="/" className="flex items-center gap-2 group">
          <KaivexLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#EBE6DC]/70 dark:bg-[#121824]/70 p-1 rounded-2xl border border-[#DCD5C9] dark:border-[#1E2636] transition-colors">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-[#1A2333] text-[#1E826C] dark:text-[#2DD4BF] border border-[#D5CEC2] dark:border-[#2B384E] shadow-sm'
                    : 'text-[#665F56] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1E826C] dark:text-[#2DD4BF]' : 'text-current'}`} />
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
            className="p-2 rounded-xl text-[#665F56] dark:text-[#94A3B8] hover:text-[#1C1917] dark:hover:text-white bg-[#EAE5DB]/60 dark:bg-[#121824]/60 hover:bg-[#E0DACF] dark:hover:bg-[#1B2332] border border-[#DCD5C9] dark:border-[#20293A] transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1E826C]" />}
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            title="Download full JSON export"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1C1917] dark:text-slate-200 bg-[#EAE5DB]/80 dark:bg-[#121824]/80 hover:bg-[#E0DACF] dark:hover:bg-[#1A2332] border border-[#DCD5C9] dark:border-[#232D3F] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#D95323] dark:text-[#F97316]" />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>

          {/* Logout / Lock Button */}
          <button
            onClick={handleLogout}
            title="Lock session"
            className="p-2 rounded-xl text-[#665F56] dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#EAE5DB]/80 dark:bg-[#121824]/80 border border-[#DCD5C9] dark:border-[#20293A]"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1E826C]" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#EAE5DB]/80 dark:bg-[#121824]/80 border border-[#DCD5C9] dark:border-[#20293A]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-[#F5F2EB] dark:bg-[#0E131C] border-b border-[#E2DDD5] dark:border-[#20293A] space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-white dark:bg-[#182130] text-[#1E826C] dark:text-[#2DD4BF] border border-[#D5CEC2] dark:border-[#28354A]'
                    : 'text-[#665F56] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 text-[#1E826C] dark:text-[#2DD4BF]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#E2DDD5] dark:border-[#20293A] flex items-center justify-between">
            <button
              onClick={() => {
                handleExport();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-[#141C29] border border-[#DCD5C9] dark:border-[#20293A]"
            >
              <Download className="w-4 h-4 text-[#D95323] dark:text-[#F97316]" />
              <span>Export Data</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Lock PIN</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}