import React from 'react';

interface AppLogoProps {
  className?: string;
}

/**
 * Generic Logo component that supports White Labeling.
 * It attempts to load an image from the environment variable VITE_APP_LOGO_URL.
 * If not provided, it falls back to a clean, modern SVG calendar icon.
 */
export const AppLogo: React.FC<AppLogoProps> = ({ className }) => {
  const customLogoUrl = import.meta.env.VITE_APP_LOGO_URL;

  if (customLogoUrl) {
    return <img src={customLogoUrl} alt="Logo" className={className} />;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
};
