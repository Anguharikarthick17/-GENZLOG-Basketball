import React from 'react';

interface TrajectoryGuideProps {
  visible: boolean;
}

export const TrajectoryGuide: React.FC<TrajectoryGuideProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="trajectory-guide-container" aria-hidden="true">
      <svg
        className="trajectory-guide-svg"
        viewBox="0 0 360 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Parabolic arc from bottom left file (x: 55, y: 220) to hoop rim (x: 180, y: 155) peaking around (x: 120, y: 55) */}
        <path
          d="M 60 215 Q 110 50 180 155"
          fill="none"
          stroke="#C7D2FE"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="trajectory-path"
        />

        {/* Floating animated particles along trajectory */}
        <circle cx="85" cy="155" r="2.5" fill="#818CF8" className="guide-dot dot-1" />
        <circle cx="115" cy="95" r="3" fill="#6366F1" className="guide-dot dot-2" />
        <circle cx="150" cy="80" r="2.5" fill="#818CF8" className="guide-dot dot-3" />
        <circle cx="172" cy="120" r="2" fill="#A5B4FC" className="guide-dot dot-4" />
      </svg>
    </div>
  );
};
