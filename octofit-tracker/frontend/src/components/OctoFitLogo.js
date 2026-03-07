import React from 'react';

function OctoFitLogo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OctoFit Logo"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Octagonal background */}
      <polygon
        points="50,2 79,13 96,38 96,62 79,87 50,98 21,87 4,62 4,38 21,13"
        fill="url(#logoGradient)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />

      {/* Inner octagon */}
      <polygon
        points="50,12 72,20 85,40 85,60 72,80 50,88 28,80 15,60 15,40 28,20"
        fill="rgba(0,0,0,0.2)"
        stroke="none"
      />

      {/* Heartbeat/pulse line */}
      <polyline
        points="12,50 30,50 36,50 40,30 45,65 50,25 55,70 60,40 64,50 70,50 88,50"
        stroke="url(#pulseGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#logoGlow)"
      />

      {/* Small octopus tentacle accents */}
      <circle cx="30" cy="75" r="3" fill="rgba(0,212,255,0.6)" />
      <circle cx="50" cy="82" r="3" fill="rgba(0,212,255,0.5)" />
      <circle cx="70" cy="75" r="3" fill="rgba(0,212,255,0.4)" />
    </svg>
  );
}

export default OctoFitLogo;
