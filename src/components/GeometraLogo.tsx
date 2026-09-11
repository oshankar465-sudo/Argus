import React from 'react';

interface GeometraLogoProps {
  className?: string;
  size?: number;
}

export const GeometraLogo: React.FC<GeometraLogoProps> = ({ className = 'w-8 h-8', size }) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GEOMETRA - ARGUS Logo"
    >
      <defs>
        {/* Soft Circular Background Gradient */}
        <radialGradient id="geoBg" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </radialGradient>

        {/* Upper Blade Top Facet (Light Silver) */}
        <linearGradient id="geoUpperLight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Upper Blade Bottom Facet (Shadow Silver) */}
        <linearGradient id="geoUpperDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="60%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Lower Blade Top Facet */}
        <linearGradient id="geoLowerLight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Lower Blade Bottom Facet */}
        <linearGradient id="geoLowerDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="80%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <filter id="geoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* White Circular Base with subtle shadow */}
      <circle cx="256" cy="256" r="250" fill="url(#geoBg)" stroke="#E5E7EB" strokeWidth="3" filter="url(#geoShadow)" />

      {/* Center Stylized G Monogram (Dark Slate / Black #1E2024) */}
      <path
        fill="#1F2227"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 256 104 C 172.05 104 104 172.05 104 256 C 104 339.95 172.05 408 256 408 C 339.95 408 408 339.95 408 256 C 408 248.5 407.45 241.13 406.4 233.95 L 260 233.95 L 260 278 L 360.5 278 C 347.1 328.7 305.6 366 256 366 C 195.25 366 146 316.75 146 256 C 146 195.25 195.25 146 256 146 C 285.8 146 312.8 157.8 332.5 177 L 364 145 C 335.6 119.7 297.8 104 256 104 Z"
      />

      {/* Center Inner Disk */}
      <circle cx="270" cy="190" r="46" fill="#F8FAFC" />
      <path d="M 256 146 C 290 146 318 174 318 208 L 260 208 L 260 146 Z" fill="#1F2227" />

      {/* Upper Diagonal Sharp Silver Blade */}
      <polygon points="260,238 418,102 320,238" fill="url(#geoUpperLight)" />
      <polygon points="260,238 418,102 396,238" fill="url(#geoUpperDark)" />
      <line x1="260" y1="238" x2="418" y2="102" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

      {/* Lower Diagonal Sharp Silver Blade */}
      <polygon points="228,272 296,272 194,402 106,384" fill="url(#geoLowerLight)" />
      <polygon points="296,272 208,402 194,402 228,272" fill="url(#geoLowerDark)" />
      <polygon points="106,384 194,402 112,392" fill="#F1F5F9" />
      <line x1="228" y1="272" x2="106" y2="384" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};
