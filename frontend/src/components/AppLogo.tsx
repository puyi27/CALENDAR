import React from 'react';

interface AppLogoProps {
  className?: string;
}

/**
 * Premium PresenceLink Logo.
 * A sophisticated abstract design representing 'Presence' (Pulse) and 'Link' (Connection).
 * Features a modern gradient and high-end geometric paths.
 */
export const AppLogo: React.FC<AppLogoProps> = ({ className }) => {
  const customLogoUrl = import.meta.env.VITE_APP_LOGO_URL;

  if (customLogoUrl) {
    return <img src={customLogoUrl} alt="PresenceLink" className={className} />;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4dabf7" />
            <stop offset="100%" stopColor="#ae3ec9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Abstract Link Shape */}
        <path 
          d="M30,50 Q30,30 50,30 Q70,30 70,50 Q70,70 50,70 Q30,70 30,50" 
          fill="none" 
          stroke="url(#logoGradient)" 
          strokeWidth="12" 
          strokeLinecap="round"
          filter="url(#glow)"
        />
        
        {/* Presence Pulse Pulse */}
        <circle cx="50" cy="50" r="10" fill="url(#logoGradient)">
          <animate 
            attributeName="r" 
            values="8;12;8" 
            dur="3s" 
            repeatCount="indefinite" 
          />
          <animate 
            attributeName="opacity" 
            values="1;0.6;1" 
            dur="3s" 
            repeatCount="indefinite" 
          />
        </circle>

        {/* Outer orbital */}
        <path 
          d="M15,50 A35,35 0 1,1 85,50" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeDasharray="10 10" 
          opacity="0.3" 
        />
      </svg>
    </div>
  );
};
