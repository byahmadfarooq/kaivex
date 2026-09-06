'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Delete, ArrowRight, Sparkles } from 'lucide-react';

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
    setPin(prev => prev.slice(0, -1));
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center z-10">
        {/* Logo & Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0d121d] rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Kaivex
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-8 font-medium">Personal Operating System</p>

        {/* PIN Entry Card */}
        <div className="w-full bg-[#0d131f]/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/60 flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
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
                      ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50 scale-125'
                      : 'bg-slate-700/80'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium mb-4 animate-fadeIn">
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
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 active:bg-cyan-950/40 active:border-cyan-500/40 border border-slate-700/40 text-xl font-semibold text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/40 text-xs uppercase tracking-wider font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={loading || pin.length >= 4}
              className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 active:bg-cyan-950/40 border border-slate-700/40 text-xl font-semibold text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/40 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Verifying session...</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500/70" />
          <span>Single-user private system for Ahmad</span>
        </div>
      </div>
    </div>
  );
}