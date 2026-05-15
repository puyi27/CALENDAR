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
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={appName} className="h-full w-auto object-contain" />
      ) : (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-neutral shadow-xl ring-1 ring-black/5">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent text-white shadow-inner">
              <CalendarMonthIcon fontSize="large" />
            </div>
          </div>
        </div>
      )}
      {showName && (
        <div className="flex flex-col items-center text-center">
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-background-shine leading-none">
            {appName}
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-base-content/30 leading-none mt-2">
            Smart Presence Platform
          </span>
        </div>
      )}
    </div>
  );
};
