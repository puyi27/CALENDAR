import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { type Category } from '../types';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CategoryIcon from '@mui/icons-material/Category';
import ShieldIcon from '@mui/icons-material/Shield';
import AddBoxIcon from '@mui/icons-material/AddBox';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import BusinessIcon from '@mui/icons-material/Business';
import LinkIcon from '@mui/icons-material/Link';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import { getDynamicCategoryName, getCategoryIcon, getCategoryColorClass, ALLOWED_ICON_NAMES } from '../utils/categoryUtils';

import { API_URL } from '../config';

const CustomSelect = ({ value, onChange, options, placeholder, disabled, className = "h-12 text-sm" }: { value: any, onChange: any, options: any[], placeholder?: string, disabled?: boolean, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o: any) => String(o.value) === String(value));

  return (
    <div className="relative w-full">
      {isOpen && <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 w-full bg-base-100 rounded-xl border border-base-300 focus:outline-none font-medium shadow-sm transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-base-200' : 'hover:border-primary/50 cursor-pointer'} relative z-[10] ${className} ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={selectedOption ? 'text-base-content' : 'text-base-content/50'}>
            {selectedOption ? selectedOption.label : (placeholder || '---')}
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full z-[110] max-h-60 overflow-y-auto animate-fade-in-up flex flex-col gap-1">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${String(value) === String(opt.value) ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-primary/5 hover:text-primary hover:pl-5'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              <div className="w-4 flex justify-center shrink-0">
                {String(value) === String(opt.value) && <span className="text-primary text-lg leading-none">✓</span>}
              </div>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const { users, categories, currentUser, token, fetchGlobalData } = useStore();

  const [registeredDepartments, setRegisteredDepartments] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<{date: string, name_holiday: string}[]>([]);
  const [activeNavigationTab, setActiveNavigationTab] = useState<'users' | 'categories' | 'departments' | 'holidays'>('users');

  const [searchQueryString, setSearchQueryString] = useState('');
  const [departmentFilterSelection, setDepartmentFilterSelection] = useState('ALL');
  const [paginationIndex, setPaginationIndex] = useState(1);
  const MAX_RECORDS_PER_PAGE = 20;

  const grantsSuperAdminPrivileges = currentUser?.role?.toLowerCase() === 'superadmin';

  const [newUserPayload, setNewUserPayload] = useState({
    full_name: '', email: '', alias: '', work: '', role: 'user',
    department: '', password: '', phoneNumber: '', default_category_id: '', can_work_weekends: false
  });

  const [newCategoryPayload, setNewCategoryPayload] = useState({
    name: '', name_en: '', name_es: '', icon: 'Business'
  });

  const [newDepartmentPayload, setNewDepartmentPayload] = useState({
    name: '', webhook_url: '', default_category_id: ''
  });

  const [newHolidayPayload, setNewHolidayPayload] = useState({
    date: dayjs().format('YYYY-MM-DD'), name_holiday: ''
  });

  const [targetedUserForEdit, setTargetedUserForEdit] = useState<any>(null);
  const [targetedCategoryForEdit, setTargetedCategoryForEdit] = useState<Category | null>(null);
  const [targetedDepartmentForEdit, setTargetedDepartmentForEdit] = useState<any>(null);
  const [deletionConfirmationTarget, setDeletionConfirmationTarget] = useState<{ type: 'user' | 'category' | 'department' | 'holiday', id: any } | null>(null);

  const [isCategoryIconDropdownOpen, setIsCategoryIconDropdownOpen] = useState(false);
  const [isEditCategoryIconDropdownOpen, setIsEditCategoryIconDropdownOpen] = useState(false);

  const validDepartmentCategories = useMemo(() => {
    return categories.filter(c => {
      const icon = c.icon || '';
      const name = (c.name || '').toLowerCase();
      return icon !== 'BeachAccess' && icon !== 'Sick' && icon !== 'Flight' && 
             !name.includes('ferie') && !name.includes('malattia') && !name.includes('travel') && !name.includes('trasferta');
    });
  }, [categories]);

  const compiledUserDataset = useMemo(() => {
    return users.filter(evaluatingUser => {
      const satisfiesSearchCondition = (evaluatingUser.alias || '').toLowerCase().includes(searchQueryString.toLowerCase()) ||
        (evaluatingUser.full_name || '').toLowerCase().includes(searchQueryString.toLowerCase()) ||
        (evaluatingUser.email || '').toLowerCase().includes(searchQueryString.toLowerCase()) ||
        (evaluatingUser.work || '').toLowerCase().includes(searchQueryString.toLowerCase());
      const satisfiesDepartmentCondition = departmentFilterSelection === 'ALL' || evaluatingUser.department === departmentFilterSelection;
      const satisfiesAdminScope = grantsSuperAdminPrivileges || evaluatingUser.department === currentUser?.department;
      return satisfiesSearchCondition && satisfiesDepartmentCondition && satisfiesAdminScope;
    });
  }, [users, searchQueryString, departmentFilterSelection, grantsSuperAdminPrivileges, currentUser]);

  const calculatedTotalPages = Math.max(1, Math.ceil(compiledUserDataset.length / MAX_RECORDS_PER_PAGE));

  useEffect(() => {
    if (paginationIndex > calculatedTotalPages) {
      setPaginationIndex(calculatedTotalPages);
    }
  }, [calculatedTotalPages, paginationIndex]);

  useEffect(() => {
    setPaginationIndex(1);
  }, [searchQueryString, departmentFilterSelection, activeNavigationTab]);

  const fetchHolidays = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/holidays`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setHolidays(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/departments`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const parsedDepartments = await response.json();
          setRegisteredDepartments(parsedDepartments);
          if (grantsSuperAdminPrivileges && parsedDepartments.length > 0 && !newUserPayload.department) {
            setNewUserPayload(prev => ({ ...prev, department: parsedDepartments[0].name }));
          }
        }
      } catch (error) {}
    };
    fetchDepartments();
    fetchHolidays();
  }, [token, grantsSuperAdminPrivileges, newUserPayload.department]);

  const dispatchUserCreation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token) return;
    try {
      const processedPayload = { ...newUserPayload };
      if (!processedPayload.default_category_id) delete (processedPayload as any).default_category_id;

      const networkResponse = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedPayload)
      });
      if (networkResponse.ok) {
        setNewUserPayload({
          full_name: '', email: '', alias: '', work: '', role: 'user',
          department: grantsSuperAdminPrivileges ? (registeredDepartments[0]?.name || 'hub') : (currentUser?.department || 'hub'),
          password: '', phoneNumber: '', default_category_id: '', can_work_weekends: false
        });
        await fetchGlobalData();
        toast.success(t('admin.user_created', 'User created effectively'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const dispatchUserUpdateMutation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token || !targetedUserForEdit) return;
    try {
      const processedPayload = { ...targetedUserForEdit };
      if (!processedPayload.password || processedPayload.password.trim() === '') delete processedPayload.password;
      if (!processedPayload.default_category_id) processedPayload.default_category_id = null;

      const networkResponse = await fetch(`${API_URL}/users/${targetedUserForEdit.id_user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedPayload)
      });
      if (networkResponse.ok) {
        setTargetedUserForEdit(null);
        await fetchGlobalData();
        toast.success(t('admin.user_updated', 'User updated effectively'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const dispatchCategoryCreation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token) return;
    try {
      const networkResponse = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCategoryPayload)
      });
      if (networkResponse.ok) {
        setNewCategoryPayload({ name: '', name_en: '', name_es: '', icon: 'Business' });
        await fetchGlobalData();
        toast.success(t('admin.cat_saved', 'Category saved'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const dispatchCategoryUpdateMutation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token || !targetedCategoryForEdit) return;
    try {
      const networkResponse = await fetch(`${API_URL}/categories/${targetedCategoryForEdit.id_category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(targetedCategoryForEdit)
      });
      if (networkResponse.ok) {
        setTargetedCategoryForEdit(null);
        await fetchGlobalData();
        toast.success(t('admin.cat_saved', 'Category saved'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const dispatchDepartmentCreation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token) return;
    try {
      const processedPayload = { ...newDepartmentPayload };
      if (!processedPayload.default_category_id) delete (processedPayload as any).default_category_id;

      const networkResponse = await fetch(`${API_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedPayload)
      });
      if (networkResponse.ok) {
        setNewDepartmentPayload({ name: '', webhook_url: '', default_category_id: '' });
        await fetchGlobalData();
        toast.success(t('admin.alert_success', 'Successful interaction'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const dispatchDepartmentUpdateMutation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token || !targetedDepartmentForEdit) return;
    try {
      const processedPayload = {
        webhook_url: targetedDepartmentForEdit.webhook_url,
        default_category_id: targetedDepartmentForEdit.default_category_id || null
      };

      const networkResponse = await fetch(`${API_URL}/departments/${targetedDepartmentForEdit.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedPayload)
      });
      if (networkResponse.ok) {
        setTargetedDepartmentForEdit(null);
        await fetchGlobalData();
        toast.success(t('admin.alert_success', 'Successful interaction'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const dispatchHolidayCreation = async (domEvent: React.FormEvent) => {
    domEvent.preventDefault();
    if (!token) return;
    try {
      const networkResponse = await fetch(`${API_URL}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newHolidayPayload)
      });
      if (networkResponse.ok) {
        setNewHolidayPayload({ date: dayjs().format('YYYY-MM-DD'), name_holiday: '' });
        fetchHolidays();
        toast.success(t('admin.alert_success', 'Successful interaction'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const importHolidaysFromAPI = async (countryCode: string) => {
    const year = dayjs().format('YYYY');
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      const payload = data.map((h: any) => ({ date: h.date, name_holiday: h.localName }));
      const bulkRes = await fetch(`${API_URL}/holidays/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ holidays: payload })
      });
      if (bulkRes.ok) {
         toast.success(t('admin.alert_success', 'Imported successfully'));
         fetchHolidays();
      }
    } catch (e) {
      toast.error(t('admin.err_network', 'Network error importing holidays'));
    }
  };

  const commitDeletionSequence = async () => {
    if (!token || !deletionConfirmationTarget) return;
    const { type, id } = deletionConfirmationTarget;

    try {
      let targetEndpointReference = '';
      if (type === 'user') targetEndpointReference = `/users/${id}`;
      if (type === 'category') targetEndpointReference = `/categories/${id}`;
      if (type === 'department') targetEndpointReference = `/departments/${id}`;
      if (type === 'holiday') targetEndpointReference = `/holidays/${id}`;

      const networkResponse = await fetch(`${API_URL}${targetEndpointReference}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (networkResponse.ok) {
        if (type === 'holiday') {
          fetchHolidays();
        } else {
          await fetchGlobalData();
        }
        setDeletionConfirmationTarget(null);
        toast.success(t('admin.alert_success', 'Successful interaction'));
      } else {
        toast.error(t('admin.err_server', 'Server error'));
      }
    } catch (networkException) {
      toast.error(t('admin.err_network', 'Network error'));
    }
  };

  const isolatedPaginationSlice = compiledUserDataset.slice((paginationIndex - 1) * MAX_RECORDS_PER_PAGE, paginationIndex * MAX_RECORDS_PER_PAGE);

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-24 lg:pb-10">
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

      {activeNavigationTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 border border-base-300 shadow-lg border-t-4 border-t-primary/30">
            <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2"><PersonAddIcon className="text-primary" /> {t('admin.new_user', 'New User')}</h2>
            <form onSubmit={dispatchUserCreation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.full_name', 'Full Name')}</span></label><input type="text" placeholder={t('admin.user_ph_name', 'Full Name')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.full_name} onChange={e => setNewUserPayload({ ...newUserPayload, full_name: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.alias', 'Alias')}</span></label><input type="text" maxLength={15} placeholder={t('admin.user_ph_alias', 'Alias')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.alias} onChange={e => setNewUserPayload({ ...newUserPayload, alias: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.email', 'Email')}</span></label><input type="email" autoComplete="off" placeholder={t('admin.user_ph_email', 'Email')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.email} onChange={e => setNewUserPayload({ ...newUserPayload, email: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.password', 'Password')}</span></label><input type="password" autoComplete="new-password" placeholder={t('admin.password_ph_new', 'Password')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.password} onChange={e => setNewUserPayload({ ...newUserPayload, password: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.phone', 'Phone')}</span></label><input type="text" placeholder={t('admin.user_ph_phone', 'Phone')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.phoneNumber} onChange={e => setNewUserPayload({ ...newUserPayload, phoneNumber: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.profession', 'Job Title')}</span></label><input type="text" placeholder={t('admin.user_ph_work', 'Job Title')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.work} onChange={e => setNewUserPayload({ ...newUserPayload, work: e.target.value })} required /></div>
                
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.role', 'Role')}</span></label>
                  <CustomSelect
                    value={newUserPayload.role}
                    onChange={(val: string) => setNewUserPayload({ ...newUserPayload, role: val })}
                    options={[
                      { value: 'user', label: t('admin.user_standard', 'Standard User') },
                      { value: 'admin', label: t('admin.user_admin', 'Admin') },
                      ...(grantsSuperAdminPrivileges ? [{ value: 'superadmin', label: 'SuperAdmin' }] : [])
                    ]}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 w-full relative"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.department', 'Department')}</span></label>
                  {grantsSuperAdminPrivileges ? (
                    <CustomSelect
                      value={newUserPayload.department}
                      onChange={(val: string) => setNewUserPayload({ ...newUserPayload, department: val })}
                      options={registeredDepartments.map(d => ({ value: d.name, label: d.name }))}
                      placeholder={t('admin.select_department', '-- Select --')}
                      className="h-12 text-sm border-primary"
                    />
                  ) : (
                    <div className="h-12 flex items-center px-4 bg-base-200 rounded-xl border border-base-300 font-bold text-xs uppercase tracking-widest text-base-content/50">{currentUser?.department}</div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 w-full"><label className="px-1 flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 12 }} className="text-secondary" /><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.personal_location', 'Default Location')}</span></label>
                  <CustomSelect
                    value={newUserPayload.default_category_id}
                    onChange={(val: string) => setNewUserPayload({ ...newUserPayload, default_category_id: val })}
                    options={[
                      { value: '', label: t('admin.auto_department', '-- Auto (Dept) --') },
                      ...validDepartmentCategories.map(c => ({ value: c.id_category, label: getDynamicCategoryName(c, i18n.language, t) }))
                    ]}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 w-full justify-center">
                  <label className="label cursor-pointer justify-start gap-3 mt-4">
                    <input type="checkbox" className="toggle toggle-primary" checked={newUserPayload.can_work_weekends} onChange={e => setNewUserPayload({ ...newUserPayload, can_work_weekends: e.target.checked })} />
                    <span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.can_work_weekends', 'Works on Weekends')}</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200"><button type="submit" className="btn btn-primary h-12 min-h-0 px-12 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all w-full sm:w-auto"><AddBoxIcon fontSize="small" className="mr-2" /> {t('admin.create', 'Create')}</button></div>
            </form>
          </div>

          <div className="bg-base-100 rounded-[2rem] overflow-hidden border border-base-300 shadow-lg">
            <div className="p-4 border-b border-base-200 bg-base-200/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-xs"><input type="text" placeholder={t('calendar.search', 'Search')} className="input w-full pl-10 bg-base-100 border border-base-300 focus:border-primary rounded-xl text-sm h-10 shadow-inner" value={searchQueryString} onChange={(e) => setSearchQueryString(e.target.value)} /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"><SearchIcon fontSize="small" /></span></div>
              {grantsSuperAdminPrivileges && (
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/50 hidden sm:inline">{t('admin.department', 'Department')}:</span>
                  <div className="w-full sm:w-48">
                    <CustomSelect
                      value={departmentFilterSelection}
                      onChange={(val: string) => setDepartmentFilterSelection(val)}
                      options={[
                        { value: 'ALL', label: t('admin.all_depts', 'All Departments') },
                        ...registeredDepartments.map(d => ({ value: d.name, label: d.name }))
                      ]}
                      className="h-10 text-xs bg-base-100 shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="table w-full table-pin-rows">
                <thead>
                  <tr style={{background: 'linear-gradient(90deg, var(--fallback-b2,oklch(var(--b2))) 0%, var(--fallback-b1,oklch(var(--b1))) 100%)'}}>
                    <th className="font-black uppercase text-[10px] tracking-widest py-4 pl-8 border-b-2 border-base-300">{t('admin.employee', 'Employee')}</th>
                    <th className="font-black uppercase text-[10px] tracking-widest py-4 border-b-2 border-base-300">{t('admin.department', 'Department')}</th>
                    <th className="font-black uppercase text-[10px] tracking-widest py-4 border-b-2 border-base-300">{t('admin.role', 'Role')}</th>
                    <th className="font-black uppercase text-[10px] tracking-widest py-4 text-right pr-8 border-b-2 border-base-300">{t('admin.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {isolatedPaginationSlice.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-20"><div className="flex flex-col items-center justify-center text-base-content/40"><WarningAmberIcon sx={{ fontSize: 64 }} className="mb-4 opacity-50" /><p className="text-lg font-black tracking-tight">{t('admin.alert_warning', 'No records found')}</p></div></td></tr>
                  ) : (
                    isolatedPaginationSlice.map(userRecord => (
                      <tr key={userRecord.id_user} className="group hover:bg-primary/[0.02] transition-colors">
                        <td className="pl-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="avatar shrink-0">
                              <div className="w-12 h-12 rounded-2xl border-2 border-base-300 group-hover:border-primary/30 transition-colors shadow-sm overflow-hidden">
                                <img src={userRecord.avatar || `https://ui-avatars.com/api/?name=${userRecord.alias}&background=random`} alt="Avatar" className="object-cover w-full h-full" />
                              </div>
                            </div>
                            <div>
                              <div className="font-black text-sm text-base-content tracking-tight group-hover:text-primary transition-colors">{userRecord.full_name}</div>
                              <div className="text-xs opacity-50 font-medium mt-0.5">{userRecord.alias && <span className="font-black text-primary/70">@{userRecord.alias}</span>} · {userRecord.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center gap-1.5 bg-base-200 border border-base-300 text-base-content/70 font-black uppercase text-[10px] tracking-wider px-3 py-1.5 rounded-xl">
                            <BusinessIcon sx={{ fontSize: 11 }} className="opacity-60" />{userRecord.department}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 font-black uppercase text-[10px] py-1.5 px-3 rounded-xl ${
                            userRecord.role === 'superadmin'
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : userRecord.role === 'admin'
                              ? 'bg-secondary/10 text-secondary border border-secondary/30'
                              : 'bg-base-200 text-base-content/60 border border-base-300'
                          }`}>
                            {userRecord.role === 'superadmin' ? <ShieldIcon sx={{ fontSize: 12 }} /> : null}
                            {userRecord.role === 'superadmin' ? 'SuperAdmin' : (userRecord.role === 'admin' ? t('admin.user_admin', 'Admin') : t('admin.user_standard', 'Standard'))}
                          </span>
                        </td>
                        <td className="text-right pr-8 py-4 space-x-1.5 whitespace-nowrap">
                          <button onClick={() => setTargetedUserForEdit({ ...userRecord, password: '', default_category_id: userRecord.default_category_id || '', can_work_weekends: userRecord.can_work_weekends || false })} className="btn btn-ghost btn-sm text-info hover:bg-info/10 rounded-xl transition-all">
                            <EditIcon fontSize="small" />
                          </button>
                          <button onClick={() => setDeletionConfirmationTarget({ type: 'user', id: userRecord.id_user })} className="btn btn-ghost btn-sm text-error hover:bg-error/10 rounded-xl transition-all">
                            <DeleteIcon fontSize="small" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {calculatedTotalPages > 1 && (
              <div className="p-4 border-t border-base-200 flex justify-between items-center">
                <span className="text-xs font-bold text-base-content/40">{(paginationIndex - 1) * MAX_RECORDS_PER_PAGE + 1} – {Math.min(paginationIndex * MAX_RECORDS_PER_PAGE, compiledUserDataset.length)} / {compiledUserDataset.length}</span>
                <div className="flex items-center gap-1">
                  <button className="btn btn-sm btn-ghost rounded-xl" onClick={() => setPaginationIndex(p => Math.max(1, p - 1))} disabled={paginationIndex === 1}><KeyboardArrowLeftIcon fontSize="small" /></button>
                  <span className="text-xs font-black px-3 py-1.5 bg-base-200 rounded-xl border border-base-300">{paginationIndex} / {calculatedTotalPages}</span>
                  <button className="btn btn-sm btn-ghost rounded-xl" onClick={() => setPaginationIndex(p => Math.min(calculatedTotalPages, p + 1))} disabled={paginationIndex === calculatedTotalPages}><KeyboardArrowRightIcon fontSize="small" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeNavigationTab === 'categories' && grantsSuperAdminPrivileges && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 border border-base-300 shadow-lg border-t-4 border-t-secondary/30">
            <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2"><AddBoxIcon className="text-secondary" /> {t('admin.new_category', 'New Category')}</h2>
            <form onSubmit={dispatchCategoryCreation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_base', 'Category Name')}</span></label><input type="text" placeholder={t('admin.cat_ph_base', 'Category Name')} className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={newCategoryPayload.name} onChange={e => setNewCategoryPayload({ ...newCategoryPayload, name: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_en', 'Name (EN)')}</span></label><input type="text" placeholder={t('admin.cat_ph_en', 'Name (EN)')} className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={newCategoryPayload.name_en} onChange={e => setNewCategoryPayload({ ...newCategoryPayload, name_en: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_es', 'Name (ES)')}</span></label><input type="text" placeholder={t('admin.cat_ph_es', 'Name (ES)')} className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={newCategoryPayload.name_es} onChange={e => setNewCategoryPayload({ ...newCategoryPayload, name_es: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.icon', 'Icon')}</span></label>
                  <div className="relative">
                    {isCategoryIconDropdownOpen && <div className="fixed inset-0 z-[100]" onClick={() => setIsCategoryIconDropdownOpen(false)}></div>}
                    <button type="button" onClick={() => setIsCategoryIconDropdownOpen(!isCategoryIconDropdownOpen)} className="flex items-center justify-center input input-sm input-bordered rounded-xl w-full h-11 text-2xl bg-base-100 cursor-pointer hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors relative z-[10]">{getCategoryIcon(newCategoryPayload)}</button>
                    {isCategoryIconDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-64 max-h-64 overflow-y-auto grid grid-cols-4 gap-2 z-[110] animate-fade-in">
                        {ALLOWED_ICON_NAMES.map(glyphName => <div key={glyphName} className="flex justify-center"><button type="button" className={`flex items-center justify-center p-2 rounded-xl text-3xl transition-all w-12 h-12 ${newCategoryPayload.icon === glyphName ? 'bg-primary text-primary-content shadow-md scale-105' : 'hover:bg-base-200 text-base-content/80'}`} onClick={() => { setNewCategoryPayload({ ...newCategoryPayload, icon: glyphName }); setIsCategoryIconDropdownOpen(false); }} title={glyphName}>{getCategoryIcon(glyphName)}</button></div>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200"><button type="submit" className="btn btn-secondary h-11 min-h-0 px-12 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all w-full sm:w-auto">{t('admin.create', 'Create')}</button></div>
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories.map(renderedCategory => (
              <div key={renderedCategory.id_category} className="bg-base-100 flex flex-col p-5 border-2 border-base-300 rounded-[1.5rem] hover:border-secondary/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{background: 'linear-gradient(135deg, color-mix(in oklch, oklch(var(--s)) 5%, transparent) 0%, transparent 70%)'}}></div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-base-100/90 backdrop-blur-sm rounded-xl p-1 z-10 shadow-sm">
                  <button onClick={() => setTargetedCategoryForEdit(renderedCategory)} className="btn btn-ghost btn-xs btn-circle text-info hover:bg-info/10"><EditIcon sx={{ fontSize: 14 }} /></button>
                  <button onClick={() => setDeletionConfirmationTarget({ type: 'category', id: renderedCategory.id_category })} className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"><DeleteIcon sx={{ fontSize: 14 }} /></button>
                </div>
                <div className="mb-4 mt-1 relative z-10">
                  <div className={`text-4xl flex items-center justify-center w-16 h-16 bg-base-200 group-hover:bg-secondary/10 rounded-2xl border-2 border-base-300 group-hover:border-secondary/30 transition-all shadow-sm ${getCategoryColorClass(renderedCategory)}`}>
                    {getCategoryIcon(renderedCategory)}
                  </div>
                </div>
                <span className="text-sm font-black truncate text-base-content pr-8 relative z-10 group-hover:text-secondary transition-colors">{getDynamicCategoryName(renderedCategory, i18n.language, t)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeNavigationTab === 'departments' && grantsSuperAdminPrivileges && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 border border-base-300 shadow-lg">
            <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2"><BusinessIcon className="text-accent" /> {t('admin.new_department', 'New Department')}</h2>
            <form onSubmit={dispatchDepartmentCreation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.department_name', 'Department Name')}</span></label><input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 font-medium text-sm h-11 w-full uppercase" placeholder="HUB, BIGTECH" value={newDepartmentPayload.name} onChange={e => setNewDepartmentPayload({ ...newDepartmentPayload, name: e.target.value.toUpperCase() })} required /></div>
                
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 12 }} className="text-accent" /><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.category_name', 'Default Location')}</span></label>
                  <CustomSelect
                    value={newDepartmentPayload.default_category_id}
                    onChange={(val: string) => setNewDepartmentPayload({ ...newDepartmentPayload, default_category_id: val })}
                    options={[
                      { value: '', label: '---' },
                      ...validDepartmentCategories.map(c => ({ value: c.id_category, label: getDynamicCategoryName(c, i18n.language, t) }))
                    ]}
                    className="h-11 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.webhook_url', 'Webhook URL')}</span></label><input type="url" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 font-medium text-sm h-11 w-full" placeholder="https://..." value={newDepartmentPayload.webhook_url} onChange={e => setNewDepartmentPayload({ ...newDepartmentPayload, webhook_url: e.target.value })} /></div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200"><button type="submit" className="btn btn-accent h-11 min-h-0 px-12 rounded-xl font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all w-full sm:w-auto">{t('admin.create', 'Create')}</button></div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredDepartments.map(renderedDepartment => (
              <div key={renderedDepartment.name} className="bg-base-100 flex flex-col p-6 border border-base-300 rounded-[1.5rem] hover:border-accent hover:shadow-md transition-all group relative">
                <div className="absolute top-4 right-4 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-base-100/80 backdrop-blur-sm rounded-lg p-1 z-10">
                  <button onClick={() => setTargetedDepartmentForEdit(renderedDepartment)} className="btn btn-ghost btn-xs btn-circle text-info hover:bg-info/10"><EditIcon fontSize="small" /></button>
                  <button onClick={() => setDeletionConfirmationTarget({ type: 'department', id: renderedDepartment.name })} className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"><DeleteIcon fontSize="small" /></button>
                </div>
                <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center"><BusinessIcon /></div><span className="text-xl font-black truncate text-base-content uppercase tracking-widest pr-10">{renderedDepartment.name}</span></div>
                <div className="flex flex-col gap-1 mt-2 p-3 bg-base-200/50 rounded-xl border border-base-300/50"><span className="text-[10px] font-bold uppercase text-base-content/50 flex items-center gap-1"><LocationOnIcon fontSize="small" /> {t('admin.category_name', 'Default Location')}</span><span className="text-xs font-bold text-base-content/80">{renderedDepartment.category_name || <span className="italic text-base-content/40">---</span>}</span></div>
                <div className="flex flex-col gap-1 mt-2 p-3 bg-base-200/50 rounded-xl border border-base-300/50"><span className="text-[10px] font-bold uppercase text-base-content/50 flex items-center gap-1"><LinkIcon fontSize="small" /> {t('admin.webhook_url', 'Webhook URL')}</span><span className="text-xs font-mono truncate text-base-content/80" title={renderedDepartment.webhook_url || '---'}>{renderedDepartment.webhook_url || <span className="italic text-base-content/40">---</span>}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeNavigationTab === 'holidays' && grantsSuperAdminPrivileges && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-base-100 rounded-[2rem] p-6 border border-base-300 shadow-lg">
                <h2 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2"><BeachAccessIcon className="text-error" /> {t('admin.import_holidays', 'Import Holidays')}</h2>
                <p className="text-sm text-base-content/60 mb-6">{t('admin.import_holidays_desc', 'Automatically fetch public holidays for the current year using Nager.Date API.')}</p>
                 <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => importHolidaysFromAPI('IT')} className="btn btn-outline border-error text-error hover:bg-error hover:text-error-content rounded-xl flex-1">🇮🇹 {t('admin.import_italy', 'Import Italy')}</button>
                 </div>
             </div>

             <div className="bg-base-100 rounded-[2rem] p-6 border border-base-300 shadow-lg">
                <h2 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2"><AddBoxIcon className="text-error" /> {t('admin.new_holiday', 'Manual Holiday')}</h2>
                <form onSubmit={dispatchHolidayCreation} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                       <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.date', 'Date')}</span></label>
                       <input type="date" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-error focus:ring-1 focus:ring-error/30 text-sm h-11" value={newHolidayPayload.date} onChange={e => setNewHolidayPayload({ ...newHolidayPayload, date: e.target.value })} required />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                       <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.name', 'Name')}</span></label>
                       <input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-error focus:ring-1 focus:ring-error/30 text-sm h-11" placeholder={t('admin.holiday_ph', 'Local Holiday...')} value={newHolidayPayload.name_holiday} onChange={e => setNewHolidayPayload({ ...newHolidayPayload, name_holiday: e.target.value })} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-error h-11 min-h-0 rounded-xl font-black uppercase tracking-widest text-error-content shadow-md hover:shadow-lg transition-all w-full">{t('admin.add_holiday', 'Add Holiday')}</button>
                </form>
             </div>
          </div>

          <div className="bg-base-100 rounded-[2rem] overflow-hidden border border-base-300 shadow-lg p-6">
             <h2 className="text-xl font-black tracking-tight mb-6">{t('admin.registered_holidays', 'Registered Holidays')}</h2>
             {holidays.length === 0 ? (
               <div className="text-center py-10 text-base-content/40 font-bold">{t('admin.alert_warning', 'No records found')}</div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {holidays.map(h => (
                   <div key={h.date} className="flex justify-between items-center p-4 bg-base-200/50 rounded-2xl border border-base-300 group">
                     <div className="flex flex-col overflow-hidden pr-2">
                       <span className="text-xs font-black text-error">{dayjs(h.date).locale(i18n.language).format('DD MMM YYYY')}</span>
                       <span className="text-sm font-bold truncate text-base-content/80 mt-1" title={h.name_holiday}>{h.name_holiday}</span>
                     </div>
                     <button onClick={() => setDeletionConfirmationTarget({ type: 'holiday', id: h.date })} className="btn btn-ghost btn-sm btn-circle text-base-content/30 group-hover:text-error hover:bg-error/10 shrink-0"><DeleteIcon fontSize="small" /></button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      )}

      {targetedUserForEdit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTargetedUserForEdit(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-3xl p-8 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black">{t('admin.edit_user', 'Edit User')}</h3><button onClick={() => setTargetedUserForEdit(null)} className="btn btn-circle btn-ghost btn-sm bg-base-200"><CloseIcon /></button></div>
            <form onSubmit={dispatchUserUpdateMutation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.full_name', 'Full Name')}</span></label><input type="text" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.full_name} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, full_name: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.alias', 'Alias')}</span></label><input type="text" maxLength={15} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.alias} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, alias: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.email', 'Email')}</span></label><input type="email" autoComplete="off" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.email} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, email: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-error/80">{t('admin.password', 'Password')}</span></label><input type="password" autoComplete="new-password" placeholder={t('admin.password_ph_edit', 'Leave empty to keep current')} className="input input-bordered w-full bg-base-100 rounded-xl border-error/30 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.password} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, password: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.profession', 'Job Title')}</span></label><input type="text" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.work} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, work: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.phone', 'Phone')}</span></label><input type="text" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.phoneNumber} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, phoneNumber: e.target.value })} /></div>
                
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.role', 'Role')}</span></label>
                  <CustomSelect
                    value={targetedUserForEdit.role}
                    onChange={(val: string) => setTargetedUserForEdit({ ...targetedUserForEdit, role: val })}
                    options={[
                      { value: 'user', label: t('admin.user_standard', 'Standard User') },
                      { value: 'admin', label: t('admin.user_admin', 'Admin') },
                      ...(grantsSuperAdminPrivileges ? [{ value: 'superadmin', label: 'SuperAdmin' }] : [])
                    ]}
                  />
                </div>
                
                {grantsSuperAdminPrivileges && (
                  <div className="flex flex-col gap-1.5 w-full relative">
                    <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.department', 'Department')}</span></label>
                    <CustomSelect
                      value={targetedUserForEdit.department}
                      onChange={(val: string) => setTargetedUserForEdit({ ...targetedUserForEdit, department: val })}
                      options={registeredDepartments.map(d => ({ value: d.name, label: d.name }))}
                      placeholder={t('admin.select_department', '-- Select --')}
                      className="h-12 text-sm border-primary"
                    />
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1 flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 12 }} className="text-secondary" /><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.personal_location', 'Default Location')}</span></label>
                  <CustomSelect
                    value={targetedUserForEdit.default_category_id || ''}
                    onChange={(val: string) => setTargetedUserForEdit({ ...targetedUserForEdit, default_category_id: val })}
                    options={[
                      { value: '', label: t('admin.auto_department', '-- Auto (Dept) --') },
                      ...validDepartmentCategories.map(c => ({ value: c.id_category, label: getDynamicCategoryName(c, i18n.language, t) }))
                    ]}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 w-full justify-center">
                  <label className="label cursor-pointer justify-start gap-3 mt-4">
                    <input type="checkbox" className="toggle toggle-primary" checked={targetedUserForEdit.can_work_weekends} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, can_work_weekends: e.target.checked })} />
                    <span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.can_work_weekends', 'Works on Weekends')}</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200"><button type="submit" className="btn btn-primary w-full sm:w-auto px-12 h-12 min-h-0 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"><SaveIcon fontSize="small" className="mr-2" /> {t('admin.save', 'Save')}</button></div>
            </form>
          </div>
        </div>
      )}

      {targetedCategoryForEdit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTargetedCategoryForEdit(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-2xl p-8 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black">{t('admin.edit_category', 'Edit Category')}</h3><button onClick={() => setTargetedCategoryForEdit(null)} className="btn btn-circle btn-ghost btn-sm bg-base-200"><CloseIcon /></button></div>
            <form onSubmit={dispatchCategoryUpdateMutation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_base', 'Category Name')}</span></label><input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={targetedCategoryForEdit.name} onChange={e => setTargetedCategoryForEdit({ ...targetedCategoryForEdit, name: e.target.value })} required /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_en', 'Name (EN)')}</span></label><input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={targetedCategoryForEdit.name_en || ''} onChange={e => setTargetedCategoryForEdit({ ...targetedCategoryForEdit, name_en: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_es', 'Name (ES)')}</span></label><input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={targetedCategoryForEdit.name_es || ''} onChange={e => setTargetedCategoryForEdit({ ...targetedCategoryForEdit, name_es: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.icon', 'Icon')}</span></label>
                  <div className="relative w-full">
                    {isEditCategoryIconDropdownOpen && <div className="fixed inset-0 z-[100]" onClick={() => setIsEditCategoryIconDropdownOpen(false)}></div>}
                    <button type="button" onClick={() => setIsEditCategoryIconDropdownOpen(!isEditCategoryIconDropdownOpen)} className="flex items-center justify-between px-4 input-bordered bg-base-100 rounded-xl border border-base-300 w-full h-11 hover:border-primary/50 transition-all cursor-pointer relative z-[10]"><div className="flex items-center gap-4"><span className="text-2xl flex items-center justify-center text-primary">{getCategoryIcon(targetedCategoryForEdit)}</span><span className="font-bold text-sm text-base-content/70">{targetedCategoryForEdit.icon || 'Business'}</span></div><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isEditCategoryIconDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                    {isEditCategoryIconDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 p-3 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full grid grid-cols-4 gap-2 max-h-60 overflow-y-auto z-[110] animate-fade-in">
                        {ALLOWED_ICON_NAMES.map(glyphReference => <div key={glyphReference} className="flex justify-center"><button type="button" className={`flex items-center justify-center p-2 rounded-xl text-3xl transition-all w-14 h-14 mx-auto ${targetedCategoryForEdit.icon === glyphReference ? 'bg-primary text-primary-content shadow-md scale-105' : 'hover:bg-base-200 text-base-content/80'}`} onClick={() => { setTargetedCategoryForEdit({ ...targetedCategoryForEdit, icon: glyphReference }); setIsEditCategoryIconDropdownOpen(false); }} title={glyphReference}>{getCategoryIcon(glyphReference)}</button></div>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200"><button type="submit" className="btn btn-secondary w-full sm:w-auto px-12 h-11 min-h-0 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"><SaveIcon fontSize="small" className="mr-2" /> {t('admin.save', 'Save')}</button></div>
            </form>
          </div>
        </div>
      )}

      {targetedDepartmentForEdit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTargetedDepartmentForEdit(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-2xl p-8 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black">{t('admin.department', 'Department')}: <span className="text-accent">{targetedDepartmentForEdit.name}</span></h3><button onClick={() => setTargetedDepartmentForEdit(null)} className="btn btn-circle btn-ghost btn-sm bg-base-200"><CloseIcon /></button></div>
            <form onSubmit={dispatchDepartmentUpdateMutation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.category_name', 'Default Location')}</span></label>
                  <CustomSelect
                    value={targetedDepartmentForEdit.default_category_id || ''}
                    onChange={(val: string) => setTargetedDepartmentForEdit({ ...targetedDepartmentForEdit, default_category_id: val })}
                    options={[
                      { value: '', label: '---' },
                      ...validDepartmentCategories.map(c => ({ value: c.id_category, label: getDynamicCategoryName(c, i18n.language, t) }))
                    ]}
                    className="h-11 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full"><label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.webhook_url', 'Webhook URL')}</span></label><input type="url" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 font-medium text-sm h-11 w-full" placeholder="https://..." value={targetedDepartmentForEdit.webhook_url || ''} onChange={e => setTargetedDepartmentForEdit({ ...targetedDepartmentForEdit, webhook_url: e.target.value })} /></div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200"><button type="submit" className="btn btn-accent w-full sm:w-auto px-12 h-11 min-h-0 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"><SaveIcon fontSize="small" className="mr-2" /> {t('admin.save', 'Save')}</button></div>
            </form>
          </div>
        </div>
      )}

      {deletionConfirmationTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setDeletionConfirmationTarget(null)}></div>
          <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300 w-full max-w-sm p-8 text-center relative z-10 animate-fade-in">
            <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6"><WarningAmberIcon fontSize="large" /></div>
            <h3 className="text-2xl font-black mb-2">{t('admin.confirm_title', 'Confirm Deletion')}</h3>
            <p className="text-sm font-medium text-base-content/60 mb-8">{t('admin.confirm_warning', 'This action cannot be undone.')}</p>
            <div className="flex gap-3"><button onClick={() => setDeletionConfirmationTarget(null)} className="btn btn-ghost flex-1 rounded-xl font-bold">{t('admin.cancel', 'Cancel')}</button><button onClick={commitDeletionSequence} className="btn btn-error flex-1 rounded-xl font-black uppercase tracking-widest text-white shadow-lg shadow-error/20">{t('admin.btn_yes_delete', 'Yes, Delete')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}