import React from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface AppLogoProps {
  className?: string;
  showName?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className, showName = false }) => {
  const appName = import.meta.env.VITE_APP_NAME || 'PresenceLink';
  const logoUrl = import.meta.env.VITE_APP_LOGO_URL;

  return (
    <div className={`flex items-center ${showName ? 'justify-start gap-3' : 'justify-center'} ${className || ''}`}>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={appName} 
          className="max-h-full max-w-full object-contain block mx-auto transition-transform duration-300 hover:scale-[1.03]" 
        />
      ) : (
        <div className="flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:rotate-3">
          <CalendarMonthIcon className="text-white" />
        </div>
      )}
      {showName && (
        <div className="flex flex-col text-left">
          <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-none">
            {appName}
          </span>
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-base-content/40 leading-none mt-1">
            Smart Presence
          </span>
        </div>
      )}
    </div>
  );
};
