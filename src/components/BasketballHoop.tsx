import React from 'react';

interface BasketballHoopProps {
  isSwishing?: boolean;
  className?: string;
}

export const BasketballHoop: React.FC<BasketballHoopProps> = ({
  isSwishing = false,
  className = '',
}) => {
  return (
    <div
      className={`basketball-hoop-container ${isSwishing ? 'swishing' : ''} ${className}`}
      aria-hidden="true"
    >
      <svg
        className="basketball-hoop-svg"
        viewBox="0 0 160 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle shadow for backboard */}
          <filter id="backboard-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4F46E5" floodOpacity="0.08" />
          </filter>

          {/* Gradient for rim */}
          <linearGradient id="rim-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Rim back gradient (darker shadow inside) */}
          <linearGradient id="rim-back-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3730A3" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
        </defs>

        {/* 1. Backboard (Glass/Translucent outlined style) */}
        <g className="hoop-backboard-group">
          {/* Outer Backboard */}
          <rect
            x="24"
            y="12"
            width="112"
            height="80"
            rx="8"
            fill="white"
            fillOpacity="0.9"
            stroke="#CBD5E1"
            strokeWidth="2"
            filter="url(#backboard-shadow)"
          />

          {/* Inner Target Rectangle */}
          <rect
            x="54"
            y="36"
            width="52"
            height="40"
            rx="4"
            fill="none"
            stroke="#6366F1"
            strokeWidth="2.5"
          />

          {/* Support connector plate */}
          <path
            d="M72 82 L88 82 L85 92 L75 92 Z"
            fill="#94A3B8"
            stroke="#64748B"
            strokeWidth="1"
          />
        </g>

        {/* 2. Rim & Net Assembly (animated on swish) */}
        <g className="hoop-rim-net-group">
          {/* Back part of Rim (drawn behind net & entering file) */}
          <path
            d="M44 94 C44 86, 116 86, 116 94"
            stroke="url(#rim-back-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Hanging Net Mesh */}
          <g className="hoop-net-mesh">
            {/* Net outline guide/shading */}
            <path
              className="net-shape-bg"
              d="M48 95 L56 142 C62 147, 98 147, 104 142 L112 95 Z"
              fill="rgba(241, 245, 249, 0.2)"
            />

            {/* Top attachment loops along rim */}
            <path
              d="M 48 95 Q 52 98 56 95 Q 60 98 64 95 Q 68 98 72 95 Q 76 98 80 95 Q 84 98 88 95 Q 92 98 96 95 Q 100 98 104 95 Q 108 98 112 95"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />

            {/* Left-to-Right Diagonal Mesh Strings */}
            <path
              className="net-strand"
              d="
                M 48 95 L 62 112 L 68 130 L 66 144
                M 56 95 L 70 112 L 76 130 L 74 145
                M 64 95 L 78 112 L 84 130 L 82 145
                M 72 95 L 86 112 L 92 130 L 90 144
                M 80 95 L 94 112 L 98 128 L 96 143
                M 88 95 L 102 112 L 104 125
                M 96 95 L 108 110
              "
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Right-to-Left Diagonal Mesh Strings */}
            <path
              className="net-strand"
              d="
                M 112 95 L 98 112 L 92 130 L 94 144
                M 104 95 L 90 112 L 84 130 L 86 145
                M 96 95 L 82 112 L 76 130 L 78 145
                M 88 95 L 74 112 L 68 130 L 70 144
                M 80 95 L 66 112 L 62 128 L 64 143
                M 72 95 L 58 112 L 56 125
                M 64 95 L 52 110
              "
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Horizontal / Radial Net Knots / Rings */}
            <path
              className="net-cross-ring"
              d="M 52 108 C 62 113, 98 113, 108 108"
              fill="none"
              stroke="#A0AEC0"
              strokeWidth="1"
              strokeDasharray="2 1"
            />
            <path
              className="net-cross-ring"
              d="M 56 122 C 64 126, 96 126, 104 122"
              fill="none"
              stroke="#A0AEC0"
              strokeWidth="1"
              strokeDasharray="2 1"
            />
            <path
              className="net-cross-ring"
              d="M 60 134 C 68 138, 92 138, 100 134"
              fill="none"
              stroke="#A0AEC0"
              strokeWidth="1"
              strokeDasharray="2 1"
            />

            {/* Bottom Net Opening Hem / Loops */}
            <path
              className="net-bottom-rim"
              d="M 62 144 C 68 147, 92 147, 98 144"
              fill="none"
              stroke="#64748B"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>

          {/* Front part of Rim (drawn over net) */}
          <path
            className="hoop-rim-front"
            d="M 44 94 C 44 104, 116 104, 116 94"
            stroke="url(#rim-gradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Rim flange / mounting clip highlights */}
          <circle cx="44" cy="94" r="2.5" fill="#4338CA" />
          <circle cx="116" cy="94" r="2.5" fill="#4338CA" />
        </g>
      </svg>
    </div>
  );
};
