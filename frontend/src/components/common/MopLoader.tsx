import React from 'react';

interface MopLoaderProps {
  label?: string;
}

const STRANDS = [50, 56, 62, 68, 74, 80, 86, 92].map((x) => {
  const endX = x + (x - 71) * 0.4;
  const ctrlX = x + (endX - x) * 0.3;
  return `M${x} 124 Q${ctrlX} 132 ${endX} 141`;
});

export const MopLoader: React.FC<MopLoaderProps> = ({ label = 'Signing you in' }) => {
  return (
    <div className="mop-loader" role="status" aria-live="polite">
      <div className="mop-loader__card">
        <svg
          className="mop-loader__svg"
          viewBox="0 0 200 160"
          aria-hidden="true"
        >
          <g className="mop-puddle">
            <ellipse cx="98" cy="139" rx="84" ry="11" fill="#D6E7F9" />
            <ellipse cx="68" cy="141" rx="38" ry="6" fill="#B9D5F2" />
            <ellipse cx="150" cy="139" rx="22" ry="4" fill="#C4DBF4" />
          </g>

          <ellipse className="mop-trail" cx="70" cy="140" rx="30" ry="3" fill="#ffffff" />

          <g className="mop-bucket">
            <path
              d="M128 86 L172 86 L166 134 Q150 139 134 134 Z"
              fill="#9CC3EE"
              stroke="#1E3A6B"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M136 96 L139.5 128" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="150" cy="86" rx="22" ry="6" fill="#6E9AD3" stroke="#1E3A6B" strokeWidth="3" />
            <ellipse cx="150" cy="87" rx="16" ry="3.2" fill="#2E4F86" />
            <path d="M130 93 Q150 120 170 93" fill="none" stroke="#1E3A6B" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g className="mop-mop">
            <line x1="74" y1="113" x2="118" y2="22" stroke="#1E3A6B" strokeWidth="8" strokeLinecap="round" />
            <line x1="74" y1="113" x2="118" y2="22" stroke="#4A7CC2" strokeWidth="4" strokeLinecap="round" />
            <rect
              x="68"
              y="106"
              width="12"
              height="12"
              rx="2"
              fill="#4A7CC2"
              stroke="#1E3A6B"
              strokeWidth="2.5"
              transform="rotate(26 74 112)"
            />
            <g className="mop-strands">
              {STRANDS.map((d) => (
                <path key={`o-${d}`} d={d} fill="none" stroke="#1E3A6B" strokeWidth="7" strokeLinecap="round" />
              ))}
              {STRANDS.map((d, i) => (
                <path
                  key={`f-${d}`}
                  d={d}
                  fill="none"
                  stroke={i % 2 ? '#E8D2A6' : '#F7EBD3'}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ))}
            </g>
            <rect x="45" y="115" width="52" height="9" rx="3" fill="#4A7CC2" stroke="#1E3A6B" strokeWidth="2.5" />
          </g>
        </svg>

        <p className="mop-loader__label">
          {label}
          <span className="mop-loader__dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </div>
    </div>
  );
};
