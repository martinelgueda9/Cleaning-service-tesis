import React from 'react';

interface MopSpinnerProps {
  size?: number;
  className?: string;
}

export const MopSpinner: React.FC<MopSpinnerProps> = ({ size = 16, className = '' }) => (
  <svg
    className={`mop-spinner ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="22.5" x2="21" y2="22.5" strokeWidth="1.5" opacity="0.35" />
    <g className="mop-spinner__mop">
      <line x1="10" y1="16" x2="17" y2="2" strokeWidth="2.2" />
      <rect x="4.5" y="15.5" width="11" height="2.6" rx="1" fill="currentColor" strokeWidth="1" />
      <g className="mop-spinner__strands" strokeWidth="1.6">
        <line x1="6" y1="18.5" x2="5" y2="21.5" />
        <line x1="8.5" y1="18.5" x2="8.2" y2="21.5" />
        <line x1="11.5" y1="18.5" x2="11.8" y2="21.5" />
        <line x1="14" y1="18.5" x2="15" y2="21.5" />
      </g>
    </g>
  </svg>
);
