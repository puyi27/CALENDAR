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
  const logoUrl = import.meta.env.VITE_APP_LOGO_URL;

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
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-base-100 rounded-3xl shadow-2xl border border-base-300 p-8 md:p-10 relative z-10 animate-fade-in-up">
        <div className="flex justify-center mb-8">
          {logoUrl ? (
            <AppLogo className="w-48 h-16 text-base-content drop-shadow-sm" />
          ) : (
            <AppLogo showName className="h-12 text-base-content drop-shadow-sm" />
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight text-base-content mb-2">{t('login.welcome')}</h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-base-content/50">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 animate-fade-in">
            <LockIcon className="text-error mt-0.5" fontSize="small" />
            <span className="text-sm font-bold text-error">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="px-1 text-[10px] font-black uppercase tracking-widest text-base-content/60">{t('admin.email', 'Correo electrónico')}</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 group-focus-within:text-primary transition-colors flex items-center z-10 pointer-events-none">
                <AlternateEmailIcon fontSize="small" />
              </span>
              <input
                type="email"
                placeholder="your.name@company.com"
                className="input input-bordered w-full bg-base-100 rounded-xl pl-12 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="px-1 text-[10px] font-black uppercase tracking-widest text-base-content/60">{t('login.password')}</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 group-focus-within:text-primary transition-colors flex items-center z-10 pointer-events-none">
                <PasswordIcon fontSize="small" />
              </span>
              <input
                type="password"
                placeholder={t('login.password')}
                className="input input-bordered w-full bg-base-100 rounded-xl pl-12 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70 text-sm h-12 uppercase tracking-wider mt-2">
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : t('login.btn_login')}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-base-300 pt-8">
          <p className="text-xs text-base-content/60 leading-relaxed font-semibold uppercase tracking-widest">
            © {new Date().getFullYear()} {import.meta.env.VITE_APP_COMPANY_NAME || 'SmartPresence'} <br />
            <span className="opacity-70 font-medium normal-case tracking-normal">Todos los derechos reservados</span>
          </p>
        </div>
      </div>
    </div>
  );
};