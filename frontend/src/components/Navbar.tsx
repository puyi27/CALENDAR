import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import AddModeratorIcon from '@mui/icons-material/AddModerator';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { AppLogo } from './AppLogo';

interface NavbarProps {
  onChangeTheme: (theme: string) => void;
  onChangeLang: (lang: string) => void;
  onExportCSV?: () => void;
}

export default function Navbar({ onChangeTheme, onChangeLang, onExportCSV }: NavbarProps) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useStore();
  const [openMenu, setOpenMenu] = useState<'lang' | 'profile' | null>(null);

  if (!currentUser) return null;

  const isAdmin = currentUser.role?.toLowerCase() === 'admin' || currentUser.role?.toLowerCase() === 'superadmin' || currentUser.role === 'ADMIN';
  const currentTheme = currentUser.theme || 'light';

  return (
    <>
      <header className="sticky top-0 z-[990] w-full transition-all border-b border-base-300 bg-base-100/80 backdrop-blur-md">
        <div className="navbar max-w-[1800px] w-full mx-auto px-4 md:px-8 min-h-[4rem] flex justify-between items-center py-2">
          <Link to="/" className="transition-all hover:scale-[1.02] pl-2 md:pl-4">
            <AppLogo showName className="h-10" />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/" className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${location.pathname === '/' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}`}><CalendarMonthIcon fontSize="small" /> {t('navbar.calendar')}</Link>
            {isAdmin && <Link to="/admin" className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${location.pathname === '/admin' ? 'bg-base-200 text-base-content border border-base-300 shadow-sm' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}`}><AddModeratorIcon fontSize="small" /> {t('navbar.admin')}</Link>}
            <div className="w-px h-6 bg-base-300 mx-1 hidden md:block"></div>
            {isAdmin && onExportCSV && <button onClick={onExportCSV} className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"><CloudDownloadIcon fontSize="small" /></button>}
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === 'lang' ? null : 'lang')} className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content hover:bg-base-200 rounded-xl"><LanguageIcon fontSize="small" /></button>
              {openMenu === 'lang' && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setOpenMenu(null)}></div>
                  <div className="absolute right-0 top-full mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 w-40 flex flex-col gap-1.5 rounded-xl animate-fade-in z-[110]">
                    <button onClick={() => { onChangeLang('it'); setOpenMenu(null); }} className={`text-sm text-left px-4 py-2 rounded-lg transition-all ${i18n.language === 'it' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-base-200 font-semibold'}`}>🇮🇹 Italiano</button>
                    <button onClick={() => { onChangeLang('en'); setOpenMenu(null); }} className={`text-sm text-left px-4 py-2 rounded-lg transition-all ${i18n.language === 'en' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-base-200 font-semibold'}`}>🇬🇧 English</button>
                    <button onClick={() => { onChangeLang('es'); setOpenMenu(null); }} className={`text-sm text-left px-4 py-2 rounded-lg transition-all ${i18n.language === 'es' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-base-200 font-semibold'}`}>🇪🇸 Español</button>
                  </div>
                </>
              )}
            </div>
            <label className="swap swap-rotate btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content hover:bg-base-200 rounded-xl">
              <input type="checkbox" onChange={() => onChangeTheme(currentTheme === 'light' ? 'dark' : 'light')} checked={currentTheme === 'dark'} />
              <div className="swap-off flex items-center justify-center"><LightModeIcon fontSize="small" /></div>
              <div className="swap-on flex items-center justify-center"><DarkModeIcon fontSize="small" /></div>
            </label>
            <div className="relative hidden md:block ml-1">
              <button onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')} className="btn btn-ghost avatar ring-1 ring-base-300 transition-all hover:ring-primary/50 hover:shadow-md h-10 w-10 p-0 rounded-xl">
                <div className="w-full h-full bg-base-300 rounded-xl overflow-hidden border border-base-300">
                  <img alt={currentUser.alias} src={currentUser.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.alias || currentUser.full_name || 'U')}&background=random`} className="object-cover rounded-xl w-full h-full" />
                </div>
              </button>
              {openMenu === 'profile' && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setOpenMenu(null)}></div>
                  <div className="absolute right-0 top-full mt-4 p-0 shadow-2xl bg-base-100 border border-base-300 w-64 rounded-2xl overflow-hidden flex flex-col animate-fade-in z-[110]">
                    <div className="px-4 py-4 flex items-center gap-3 border-b border-base-300 bg-base-200 transition-colors">
                      <div className="avatar"><div className="w-10 h-10 rounded-xl border border-base-300 bg-base-300 overflow-hidden shadow-inner"><img alt={currentUser.alias} src={currentUser.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.alias || currentUser.full_name || 'U')}&background=random`} className="rounded-xl object-cover w-full h-full" /></div></div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold truncate tracking-tight text-base-content">{currentUser.full_name || currentUser.alias}</span>
                        <span className="text-xs text-base-content/70 truncate font-medium mt-0.5">{currentUser.work || t('profile.team_member')}</span>
                      </div>
                    </div>
                    <div className="p-2 gap-1.5 flex flex-col bg-base-100">
                      <Link to={`/profile/${currentUser.id_user}`} onClick={() => setOpenMenu(null)} className="py-2.5 px-3 hover:bg-base-200 text-sm font-semibold flex items-center gap-3 rounded-xl transition-colors"><PersonIcon fontSize="small" className="text-base-content/50" />{t('navbar.profile')}</Link>
                      <div className="w-full h-px bg-base-300 my-1"></div>
                      <button onClick={() => { setOpenMenu(null); logout(); }} className="py-2.5 px-3 hover:bg-error/10 hover:text-error text-error text-sm font-semibold flex items-center gap-3 rounded-xl transition-all text-left"><LogoutIcon fontSize="small" />{t('navbar.logout')}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={logout} className="md:hidden btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-error hover:bg-error/10 ml-1 rounded-xl transition-all"><LogoutIcon fontSize="small" /></button>
          </div>
        </div>
      </header>

      <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[990] pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all bg-base-100 border-t border-base-300">
        <div className="flex justify-around items-center h-16 px-2.5 relative">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-[80%] gap-1 transition-all rounded-xl ${location.pathname === '/' ? 'text-primary bg-primary/5' : 'text-base-content/50 hover:bg-base-200/50'}`}><CalendarMonthIcon fontSize="small" /><span className="text-[10px] font-bold tracking-tight">{t('navbar.calendar')}</span></Link>
          <Link to={`/profile/${currentUser.id_user}`} className={`flex flex-col items-center justify-center w-full h-[80%] gap-1 transition-all rounded-xl ${location.pathname.includes('/profile') ? 'text-primary bg-primary/5' : 'text-base-content/50 hover:bg-base-200/50'}`}><div className={`w-5 h-5 rounded-full overflow-hidden border transition-all ${location.pathname.includes('/profile') ? 'border-primary ring-1 ring-primary/30 shadow-sm' : 'border-base-content/30 opacity-70'}`}><img src={currentUser.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.alias || currentUser.full_name || 'U')}&background=random`} alt="Profile" className="w-full h-full object-cover" /></div><span className="text-[10px] font-bold tracking-tight">{t('navbar.profile')}</span></Link>
          {isAdmin && <Link to="/admin" className={`flex flex-col items-center justify-center w-full h-[80%] gap-1 transition-all rounded-xl ${location.pathname === '/admin' ? 'text-base-content bg-base-200 border border-base-300 shadow-sm' : 'text-base-content/50 hover:bg-base-200/50'}`}><AddModeratorIcon fontSize="small" /><span className="text-[10px] font-bold tracking-tight">{t('navbar.admin')}</span></Link>}
        </div>
      </div>
    </>
  );
}