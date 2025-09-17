import React from 'react';

interface CandlestickChartProps {
  className?: string;
}

export function CandlestickChart({ className }: CandlestickChartProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      
      {/* Candlestick 1 - Bullish */}
      <line x1="14" y1="20" x2="14" y2="44" stroke="white" strokeWidth="1" opacity="0.7" />
      <rect x="12" y="26" width="4" height="12" fill="#22c55e" rx="1" />
      
      {/* Candlestick 2 - Bearish */}
      <line x1="22" y1="18" x2="22" y2="42" stroke="white" strokeWidth="1" opacity="0.7" />
      <rect x="20" y="24" width="4" height="10" fill="#ef4444" rx="1" />
      
      {/* Candlestick 3 - Bullish (Higher) */}
      <line x1="30" y1="15" x2="30" y2="35" stroke="white" strokeWidth="1" opacity="0.7" />
      <rect x="28" y="20" width="4" height="8" fill="#22c55e" rx="1" />
      
      {/* Candlestick 4 - Bullish (Highest) */}
      <line x1="38" y1="12" x2="38" y2="30" stroke="white" strokeWidth="1" opacity="0.7" />
      <rect x="36" y="16" width="4" height="6" fill="#22c55e" rx="1" />
      
      {/* Candlestick 5 - Bullish (Very High) */}
      <line x1="46" y1="10" x2="46" y2="25" stroke="white" strokeWidth="1" opacity="0.7" />
      <rect x="44" y="14" width="4" height="5" fill="#22c55e" rx="1" />
      
      {/* Trend line */}
      <path
        d="M10 45 Q32 25 54 15"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
        strokeLinecap="round"
      />
      
      {/* Arrow at the end of trend line */}
      <path
        d="M50 17 L54 15 L52 19"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}