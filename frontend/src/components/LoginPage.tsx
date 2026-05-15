import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LockIcon from '@mui/icons-material/Lock';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PasswordIcon from '@mui/icons-material/Password';
import { AppLogo } from './AppLogo';
import { useStore } from '../store/useStore';

import { API_URL } from '../config';

export const LoginPage = () => {
  const { t } = useTranslation();
  const { setAuth } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuth(data.token, data.user);
      } else {
        setError(data.error || t('login.invalid_creds'));
      }
    } catch (err) {
      setError(t('login.server_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4 py-8 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 animate-fade-in-up">
          <AppLogo className="mb-2" />
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 p-8 md:p-12 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black tracking-tight text-white mb-3">
              {t('login.welcome')}
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
              {t('login.subtitle', 'Team Reserved Area')}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <LockIcon className="text-red-400" sx={{ fontSize: 18 }} />
              </div>
              <span className="text-sm font-medium text-red-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t('admin.email', 'Email Address')}</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl transition-all group-focus-within:bg-primary/10"></div>
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors flex items-center z-10 pointer-events-none">
                  <AlternateEmailIcon sx={{ fontSize: 20 }} />
                </span>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="w-full bg-transparent border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 focus:border-primary/50 focus:outline-none transition-all text-white placeholder:text-white/20 text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t('login.password')}</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl transition-all group-focus-within:bg-primary/10"></div>
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors flex items-center z-10 pointer-events-none">
                  <PasswordIcon sx={{ fontSize: 20 }} />
                </span>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-transparent border-2 border-white/5 rounded-2xl pl-14 pr-5 py-4 focus:border-primary/50 focus:outline-none transition-all text-white placeholder:text-white/20 text-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="group relative w-full h-14 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest overflow-hidden shadow-[0_8px_16px_-4px_rgba(var(--p),0.3)] hover:shadow-[0_12px_24px_-8px_rgba(var(--p),0.5)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('common.loading', 'Authenticating...')}</span>
                </div>
              ) : (
                <span className="relative z-10">{t('login.btn_login')}</span>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-white/30 leading-loose font-bold uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} {import.meta.env.VITE_APP_COMPANY_NAME || 'SmartPresence'} <br/>
              <span className="opacity-50 font-medium normal-case tracking-widest">{t('login.all_rights', 'Premium Enterprise Access')}</span>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-accent/30"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
        </div>
      </div>
    </div>
  );
};