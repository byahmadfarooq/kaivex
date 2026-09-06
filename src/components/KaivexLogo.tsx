'use client';

import React from 'react';

interface KaivexLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function KaivexWaveMark({ className = 'w-9 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Three distinct wave lanes that never converge */}
      {/* Top lane: Fog / Warm Fog */}
      <path
        d="M2,10 C15,4 28,16 41,10 C54,4 67,16 78,10"
        fill="none"
        strokeWidth="2.8"
        strokeLinecap="round"
        className="stroke-[#6B655F] dark:stroke-[#98A6AD]"
      />
      {/* Middle lane: Current Deepened / Ice Current */}
      <path
        d="M2,26 C15,32 28,20 41,26 C54,32 67,20 78,26"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-[#2E9C82] dark:stroke-[#8FE0CE]"
      />
      {/* Bottom lane: Flare Deepened / Signal Flare */}
      <path
        d="M2,42 C15,36 28,48 41,42 C54,36 67,48 78,42"
        fill="none"
        strokeWidth="5.5"
        strokeLinecap="round"
        className="stroke-[#D9551F] dark:stroke-[#FF7A47]"
      />
    </svg>
  );
}

export default function KaivexLogo({
  className = '',
  size = 'md',
  showText = true,
}: KaivexLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-4',
    md: 'w-9 h-5',
    lg: 'w-12 h-7',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="p-1 rounded-xl bg-[#DDD5C3]/70 dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] flex items-center justify-center transition-colors">
        <KaivexWaveMark className={iconSizes[size]} />
      </div>

      {showText && (
        <span className={`${textSizes[size]} font-display font-bold tracking-tight text-[#14181B] dark:text-[#E7ECEC]`}>
          <span className="font-bold">K</span>aive<span className="text-[#D9551F] dark:text-[#FF7A47]">x</span>
        </span>
      )}
    </div>
  );
}
