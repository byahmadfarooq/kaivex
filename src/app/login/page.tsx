'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Delete, ArrowRight, Sparkles } from 'lucide-react';
import KaivexLogo from '@/components/KaivexLogo';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const submitPin = useCallback(async (currentPin: string) => {
    if (currentPin.length !== 4) return;
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPin }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(true);
        setPin('');
      }
    } catch {
      setError(true);
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (pin.length === 4) {
      submitPin(pin);
    }
  }, [pin, submitPin]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  return (
    <div className="min-h-screen bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#14181B] dark:text-[#E7ECEC] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none transition-colors">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#D9551F]/10 dark:bg-[#FF7A47]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center z-10">
        {/* Kaivex Logo Lockup */}
        <div className="mb-2 scale-110">
          <KaivexLogo />
        </div>
        <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mb-8 font-mono uppercase tracking-widest">
          Personal Operating System
        </p>

        {/* PIN Entry Card */}
        <div className="w-full bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl flex flex-col items-center transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-5">
            <Lock className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Enter Access PIN</span>
          </div>

          {/* PIN Dots Display */}
          <div className={`flex items-center gap-4 mb-6 transition-transform ${error ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    error
                      ? 'bg-rose-500 shadow-lg shadow-rose-500/50 scale-110'
                      : isFilled
                      ? 'bg-[#D9551F] dark:bg-[#FF7A47] shadow-lg shadow-[#FF7A47]/40 scale-125'
                      : 'bg-[#CFC3AB] dark:bg-[#1D2830]'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-4 animate-fadeIn">
              Incorrect PIN. Please try again.
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={loading || pin.length >= 4}
                className="h-14 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] hover:bg-[#CFC3AB]/50 dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] font-mono text-xl font-bold text-[#14181B] dark:text-[#E7ECEC] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl bg-[#EBE3D3]/60 dark:bg-[#0B0F14]/60 hover:bg-[#CFC3AB]/30 dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] text-xs uppercase tracking-wider font-semibold text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] transition-all flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={loading || pin.length >= 4}
              className="h-14 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] hover:bg-[#CFC3AB]/50 dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] font-mono text-xl font-bold text-[#14181B] dark:text-[#E7ECEC] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl bg-[#EBE3D3]/60 dark:bg-[#0B0F14]/60 hover:bg-[#CFC3AB]/30 dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[#D9551F] dark:text-[#FF7A47] font-mono">
              <div className="w-2 h-2 rounded-full bg-[#D9551F] dark:bg-[#FF7A47] animate-ping" />
              <span>Verifying session PIN...</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-1.5 font-sans">
          <Sparkles className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
          <span>Single-user private enclave</span>
        </div>
      </div>
    </div>
  );
}
