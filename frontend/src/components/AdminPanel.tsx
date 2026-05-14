import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { API_URL } from '../config';

import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import ShieldIcon from '@mui/icons-material/Shield';

import { UserManagement } from './admin/UserManagement';
import { CategoryManagement } from './admin/CategoryManagement';
import { DepartmentManagement } from './admin/DepartmentManagement';
import { HolidayManagement } from './admin/HolidayManagement';

export default function AdminPanel() {
  const { t } = useTranslation();
  const { currentUser, token } = useStore();

  const [registeredDepartments, setRegisteredDepartments] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<{date: string, name_holiday: string}[]>([]);
  const [activeNavigationTab, setActiveNavigationTab] = useState<'users' | 'categories' | 'departments' | 'holidays'>('users');

  const grantsSuperAdminPrivileges = currentUser?.role?.toLowerCase() === 'superadmin';

  const fetchHolidays = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/holidays`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setHolidays(await res.json());
    } catch (e) {}
  };

  const fetchDepartments = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/departments`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        setRegisteredDepartments(await response.json());
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchDepartments();
    fetchHolidays();
  }, [token]);

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-24 lg:pb-10">
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-base-100 p-3 rounded-[2rem] border border-base-300 shadow-lg gap-3" style={{background: 'linear-gradient(135deg, var(--fallback-b1,oklch(var(--b1))) 70%, color-mix(in oklch, oklch(var(--p)) 4%, var(--fallback-b1,oklch(var(--b1)))))'}}>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setActiveNavigationTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${
              activeNavigationTab === 'users'
                ? 'bg-primary text-primary-content shadow-lg shadow-primary/25 scale-[1.02]'
                : 'text-base-content/50 hover:text-base-content hover:bg-base-200'
            }`}
          >
            <PeopleIcon fontSize="small" /> {t('admin.users', 'Users')}
          </button>
          {grantsSuperAdminPrivileges && (
            <>
              <button
                onClick={() => setActiveNavigationTab('categories')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeNavigationTab === 'categories'
                    ? 'bg-secondary text-secondary-content shadow-lg shadow-secondary/25 scale-[1.02]'
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-200'
                }`}
              >
                <CategoryIcon fontSize="small" /> {t('admin.categories', 'Categories')}
              </button>
              <button
                onClick={() => setActiveNavigationTab('departments')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeNavigationTab === 'departments'
                    ? 'bg-accent text-accent-content shadow-lg shadow-accent/25 scale-[1.02]'
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-200'
                }`}
              >
                <BusinessIcon fontSize="small" /> {t('admin.department', 'Departments')}
              </button>
              <button
                onClick={() => setActiveNavigationTab('holidays')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeNavigationTab === 'holidays'
                    ? 'bg-error text-error-content shadow-lg shadow-error/25 scale-[1.02]'
                    : 'text-base-content/50 hover:text-base-content hover:bg-base-200'
                }`}
              >
                <BeachAccessIcon fontSize="small" /> {t('admin.holidays', 'Holidays')}
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 bg-base-200/60 border border-base-300 h-10 px-4 font-black rounded-2xl uppercase tracking-widest text-[10px] shrink-0">
          <ShieldIcon fontSize="small" className="text-primary" />
          <span>{currentUser?.role}</span>
          <span className="text-base-content/30">·</span>
          <span className="text-primary">{grantsSuperAdminPrivileges ? t('admin.all_depts', 'All Depts') : currentUser?.department}</span>
        </div>
      </div>

      {/* Content Sections */}
      {activeNavigationTab === 'users' && (
        <UserManagement 
          grantsSuperAdminPrivileges={grantsSuperAdminPrivileges} 
          registeredDepartments={registeredDepartments} 
        />
      )}
      
      {activeNavigationTab === 'categories' && grantsSuperAdminPrivileges && (
        <CategoryManagement />
      )}
      
      {activeNavigationTab === 'departments' && grantsSuperAdminPrivileges && (
        <DepartmentManagement registeredDepartments={registeredDepartments} />
      )}
      
      {activeNavigationTab === 'holidays' && grantsSuperAdminPrivileges && (
        <HolidayManagement holidays={holidays} fetchHolidays={fetchHolidays} />
      )}
    </div>
  );
}