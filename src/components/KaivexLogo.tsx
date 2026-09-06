'use client';

import React from 'react';

interface KaivexLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function KaivexRhythmIcon({ className = 'w-7 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Wave: Stone Taupe */}
      <path
        d="M2 4C8 4 10 2 16 2C22 2 26 4 32 4C38 4 40 2 46 2"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        className="text-[#9E978E] dark:text-[#A8A29E]"
      />
      {/* Middle Wave: Kai Sea Teal */}
      <path
        d="M2 12C8 12 10 10 16 10C22 10 26 12 32 12C38 12 40 10 46 10"
        stroke="#1E826C"
        strokeWidth="2.75"
        strokeLinecap="round"
        className="dark:stroke-[#2DD4BF]"
      />
      {/* Bottom Wave: Vex Terracotta */}
      <path
        d="M2 20C8 20 10 18 16 18C22 18 26 20 32 20C38 20 40 18 46 18"
        stroke="#D95323"
        strokeWidth="2.75"
        strokeLinecap="round"
        className="dark:stroke-[#F97316]"
      />
    </svg>
  );
}

export function KaivexVertexIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 3 lines meeting at a vertex point */}
      <line x1="4" y1="8" x2="16" y2="16" stroke="#D95323" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-[#F97316]" />
      <line x1="28" y1="8" x2="16" y2="16" stroke="#1E826C" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-[#2DD4BF]" />
      <line x1="16" y1="16" x2="16" y2="28" stroke="#A8A29E" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-[#9E978E]" />
      <circle cx="16" cy="16" r="3" fill="#D95323" className="dark:fill-[#F97316]" />
    </svg>
  );
}

export default function KaivexLogo({
  className = '',
  size = 'md',
  showText = true,
}: KaivexLogoProps) {
  const iconSizes = {
    sm: 'w-6 h-4',
    md: 'w-8 h-5',
    lg: 'w-12 h-7',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className="p-1 rounded-xl bg-amber-500/10 dark:bg-slate-800/60 border border-amber-500/20 dark:border-slate-700/50 flex items-center justify-center transition-colors">
        <KaivexRhythmIcon className={iconSizes[size]} />
      </div>

      {showText && (
        <span className={`${textSizes[size]} tracking-tight font-extrabold flex items-center`}>
          <span className="text-[#1E826C] dark:text-[#2DD4BF]">Kai</span>
          <span className="text-[#D95323] dark:text-[#F97316]">vex</span>
        </span>
      )}
    </div>
  );
}