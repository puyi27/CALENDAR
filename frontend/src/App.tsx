import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';

import { useStore } from './store/useStore';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import { AppLogo } from './components/AppLogo';
import { Calendar } from './components/Calendar';
import { ProfilePage } from './components/ProfilePage';
import { LoginPage } from './components/LoginPage';
import { ExportModal } from './components/ExportModal';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { getDynamicCategoryName, getCategoryIcon } from './utils/categoryUtils';

import { API_URL } from './config';

const OledDarkTheme = () => (
  <style>{`
    html[data-theme="dark"] body { background-color: #000000 !important; color: #f3f4f6 !important; }
    html[data-theme="dark"] .bg-base-100 { background-color: #0a0a0a !important; }
    html[data-theme="dark"] .bg-base-200 { background-color: #141414 !important; }
    html[data-theme="dark"] .bg-base-300 { background-color: #1f1f1f !important; }
    html[data-theme="dark"] .border-base-200, html[data-theme="dark"] .border-base-300 { border-color: #262626 !important; }
    html[data-theme="dark"] .divide-base-300 > :not([hidden]) ~ :not([hidden]) { border-color: #262626 !important; }
    html[data-theme="dark"] .table th, html[data-theme="dark"] .table td { border-color: #262626 !important; }
    html[data-theme="dark"] .table thead th { background-color: #050505 !important; }
    html[data-theme="dark"] input, html[data-theme="dark"] select, html[data-theme="dark"] textarea { background-color: #121212 !important; border-color: #262626 !important; color: #ffffff !important; }
    html[data-theme="dark"] .modal-box { background-color: #0a0a0a !important; border: 1px solid #262626 !important; }
  `}</style>
);

export default function App() {
  const { t, i18n } = useTranslation();
  const { token, currentUser, users, categories, interactionModalContext, fetchGlobalData, updateCurrentUser, setInteractionModalContext, commitPresenceEntry, obliteratePresenceEntry } = useStore();
  const appName = import.meta.env.VITE_APP_NAME || 'PresenceLink';

  useEffect(() => {
    document.title = `${appName} - Smart Presence Platform`;
  }, [appName]);

  const [isExportInterfaceActive, setIsExportInterfaceActive] = useState(false);
  const [isScrollToTopVisible, setIsScrollToTopVisible] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  useEffect(() => {
    if (token) {
      fetchGlobalData();
    }
  }, [token, fetchGlobalData]);

  useEffect(() => {
    if (currentUser) {
      i18n.changeLanguage(currentUser.language || 'es');
      document.documentElement.setAttribute('data-theme', currentUser.theme || 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    dayjs.locale(i18n.language);
  }, [currentUser, i18n.language]);

  useEffect(() => {
    const handleViewportScroll = () => setIsScrollToTopVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleViewportScroll);
    return () => window.removeEventListener('scroll', handleViewportScroll);
  }, []);

  const dispatchUserPreferencesPatch = async (preferenceUpdates: any) => {
    if (!currentUser || !token) return;
    updateCurrentUser(preferenceUpdates);
    const requestPayload: any = { ...currentUser, ...preferenceUpdates };
    delete requestPayload.password;
    try {
      await fetch(`${API_URL}/users/${currentUser.id_user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestPayload)
      });
      fetchGlobalData();
    } catch (networkException) { }
  };

  const handleLanguageToggle = useCallback((selectedLanguageCode: string) => {
    i18n.changeLanguage(selectedLanguageCode);
    dayjs.locale(selectedLanguageCode);
    if (currentUser) {
      dispatchUserPreferencesPatch({ language: selectedLanguageCode });
    }
  }, [currentUser, i18n]);

  const triggerScrollToViewportTop = () => {
    setIsScrollingUp(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsScrollingUp(false), 700);
  };

  if (!token || !currentUser) return <LoginPage />;

  const contextualPresenceTarget = interactionModalContext ? users.find((u: any) => u.id_user === interactionModalContext.id_user)?.presences?.find((p: any) => p.date === interactionModalContext.date) : null;

  return (
    <BrowserRouter>
      <OledDarkTheme />
      <div className="min-h-screen bg-base-200 text-base-content font-sans antialiased relative overflow-x-hidden">
        <div className="premium-glow"></div>
        <Toaster position="bottom-right" toastOptions={{ className: 'bg-base-100 text-base-content border border-base-300 shadow-xl font-bold text-sm', style: { borderRadius: '1rem', background: 'var(--fallback-b1,oklch(var(--b1)))', color: 'var(--fallback-bc,oklch(var(--bc)))' } }} />

        <Navbar
          onChangeTheme={(themeIdentifier) => {
            document.documentElement.setAttribute('data-theme', themeIdentifier);
            dispatchUserPreferencesPatch({ theme: themeIdentifier });
          }}
          onChangeLang={handleLanguageToggle}
          onExportCSV={() => setIsExportInterfaceActive(true)}
        />

        <main className="max-w-[1800px] w-full mx-auto p-4 pb-24 md:p-8 animate-fade-in">
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/admin" element={(currentUser.role?.toLowerCase() === 'admin' || currentUser.role?.toLowerCase() === 'superadmin' || currentUser.role === 'ADMIN') ? <AdminPanel /> : <Navigate to="/" replace />} />
            <Route path="/profile/:id_user" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {interactionModalContext && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-base-300/60 backdrop-blur-sm" onClick={() => setInteractionModalContext(null)}></div>
            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 shadow-xl w-full max-w-lg relative z-10 animate-fade-in">
              <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-base-content">
                <CalendarMonthIcon /> 
                {t('app.date', 'Fecha')}: {interactionModalContext.date}
              </h3>
              <div className="flex items-center gap-3 mb-6">
                <AppLogo className="w-10 h-10" />
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-none">
                    PresenceLink
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-base-content/40 leading-none mt-1">
                    Smart Presence Platform
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((iteratingCategory: any) => (
                  <button 
                    key={iteratingCategory.id_category} 
                    onClick={() => {
                      commitPresenceEntry(iteratingCategory.id_category);
                      
                      if (interactionModalContext.id_user === currentUser?.id_user && interactionModalContext.date === dayjs().format('YYYY-MM-DD')) {
                        let automaticStatus = 'Disponibile';
                        const catName = (iteratingCategory.name || '').toLowerCase();
                        const icon = iteratingCategory.icon;

                        if (icon === 'Home' || icon === 'HomeWork' || catName.includes('smart') || catName.includes('telelavoro')) {
                          automaticStatus = 'Smart Working';
                        } else if (icon === 'BeachAccess' || catName.includes('ferie')) {
                          automaticStatus = 'In Ferie';
                        } else if (icon === 'Sick' || icon === 'Flight' || icon === 'Work' || catName.includes('malattia') || catName.includes('trasferta')) {
                          automaticStatus = 'Occupato';
                        }

                        dispatchUserPreferencesPatch({ status: automaticStatus });
                      }
                      
                      setInteractionModalContext(null);
                    }} 
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${contextualPresenceTarget?.categories?.id_category === iteratingCategory.id_category ? 'bg-primary text-primary-content border-primary ring-2 ring-primary scale-105' : 'bg-base-200 border-base-300 hover:border-primary/50'}`}
                  >
                    <span className="text-3xl mb-1 text-inherit">{getCategoryIcon(iteratingCategory)}</span>
                    <span className="text-[10px] font-semibold text-center leading-tight uppercase tracking-wider text-inherit mt-2">{getDynamicCategoryName(iteratingCategory, i18n.language, t)}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-base-200">
                <button className="btn btn-ghost rounded-xl font-medium text-sm" onClick={() => setInteractionModalContext(null)}>{t('app.cancel', 'Cancelar')}</button>
                {contextualPresenceTarget && (
                  <button 
                    className="btn btn-outline border-error text-error hover:bg-error hover:text-white rounded-xl text-sm font-semibold" 
                    onClick={() => {
                      obliteratePresenceEntry();
                      
                      if (interactionModalContext.id_user === currentUser?.id_user && interactionModalContext.date === dayjs().format('YYYY-MM-DD')) {
                        dispatchUserPreferencesPatch({ status: 'Disponibile' });
                      }
                      
                      setInteractionModalContext(null);
                    }}
                  >
                    <DeleteIcon fontSize="small" /> {t('app.delete', 'Eliminar')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isExportInterfaceActive && <ExportModal onClose={() => setIsExportInterfaceActive(false)} />}
        
        <button 
          onClick={triggerScrollToViewportTop} 
          className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[150] btn btn-circle btn-primary border-none shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isScrollToTopVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'}
            ${isScrollingUp ? 'scale-90 bg-primary-focus' : 'hover:scale-110'}
          `}
        >
          <div className={`absolute transition-transform duration-500 ease-in-out ${isScrollingUp ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <ArrowUpwardIcon fontSize="medium" />
          </div>
          <div className={`absolute transition-transform duration-500 ease-in-out ${isScrollingUp ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <ArrowUpwardIcon fontSize="medium" />
          </div>
        </button>
      </div>
    </BrowserRouter>
  );
}