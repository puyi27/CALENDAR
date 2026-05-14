import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { API_URL } from '../../config';
import { CustomSelect } from './CustomSelect';
import { getDynamicCategoryName } from '../../utils/categoryUtils';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import ShieldIcon from '@mui/icons-material/Shield';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddBoxIcon from '@mui/icons-material/AddBox';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

export const UserManagement = ({ grantsSuperAdminPrivileges, registeredDepartments }: { grantsSuperAdminPrivileges: boolean, registeredDepartments: any[] }) => {
  const { t, i18n } = useTranslation();
  const { users, categories, currentUser, token, fetchGlobalData } = useStore();

  const [searchQueryString, setSearchQueryString] = useState('');
  const [departmentFilterSelection, setDepartmentFilterSelection] = useState('ALL');
  const [paginationIndex, setPaginationIndex] = useState(1);
  const MAX_RECORDS_PER_PAGE = 20;

  const [newUserPayload, setNewUserPayload] = useState({
    full_name: '', email: '', alias: '', work: '', role: 'user',
    department: '', password: '', phoneNumber: '', default_category_id: '', can_work_weekends: false
  });

  const [targetedUserForEdit, setTargetedUserForEdit] = useState<any>(null);
  const [deletionConfirmationTarget, setDeletionConfirmationTarget] = useState<number | null>(null);

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
  }, [searchQueryString, departmentFilterSelection]);

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

  const commitDeletionSequence = async () => {
    if (!token || !deletionConfirmationTarget) return;
    try {
      const networkResponse = await fetch(`${API_URL}/users/${deletionConfirmationTarget}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (networkResponse.ok) {
        await fetchGlobalData();
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
    <div className="space-y-6 animate-fade-in">
      {/* Create User Form */}
      <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 border border-base-300 shadow-lg border-t-4 border-t-primary/30">
        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2"><PersonAddIcon className="text-primary" /> {t('admin.new_user', 'New User')}</h2>
        <form onSubmit={dispatchUserCreation} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.full_name', 'Full Name')}</span></label>
              <input type="text" placeholder={t('admin.user_ph_name', 'Full Name')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.full_name} onChange={e => setNewUserPayload({ ...newUserPayload, full_name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.alias', 'Alias')}</span></label>
              <input type="text" maxLength={15} placeholder={t('admin.user_ph_alias', 'Alias')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.alias} onChange={e => setNewUserPayload({ ...newUserPayload, alias: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.email', 'Email')}</span></label>
              <input type="email" autoComplete="off" placeholder={t('admin.user_ph_email', 'Email')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.email} onChange={e => setNewUserPayload({ ...newUserPayload, email: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.password', 'Password')}</span></label>
              <input type="password" autoComplete="new-password" placeholder={t('admin.password_ph_new', 'Password')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.password} onChange={e => setNewUserPayload({ ...newUserPayload, password: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.phone', 'Phone')}</span></label>
              <input type="text" placeholder={t('admin.user_ph_phone', 'Phone')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.phoneNumber} onChange={e => setNewUserPayload({ ...newUserPayload, phoneNumber: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.profession', 'Job Title')}</span></label>
              <input type="text" placeholder={t('admin.user_ph_work', 'Job Title')} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={newUserPayload.work} onChange={e => setNewUserPayload({ ...newUserPayload, work: e.target.value })} required />
            </div>
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.role', 'Role')}</span></label>
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
            
            <div className="flex flex-col gap-1.5 w-full relative">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.department', 'Department')}</span></label>
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

            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1 flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 12 }} className="text-secondary" /><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.personal_location', 'Default Location')}</span></label>
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
          <div className="flex justify-end mt-6 pt-5 border-t border-base-200">
            <button type="submit" className="btn btn-primary h-12 min-h-0 px-12 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all w-full sm:w-auto"><AddBoxIcon fontSize="small" className="mr-2" /> {t('admin.create', 'Create')}</button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-base-100 rounded-[2rem] overflow-hidden border border-base-300 shadow-lg">
        <div className="p-4 border-b border-base-200 bg-base-200/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input type="text" placeholder={t('calendar.search', 'Search')} className="input w-full pl-10 bg-base-100 border border-base-300 focus:border-primary rounded-xl text-sm h-10 shadow-inner" value={searchQueryString} onChange={(e) => setSearchQueryString(e.target.value)} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"><SearchIcon fontSize="small" /></span>
          </div>
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
                      <button onClick={() => setDeletionConfirmationTarget(userRecord.id_user)} className="btn btn-ghost btn-sm text-error hover:bg-error/10 rounded-xl transition-all">
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

      {/* Edit User Modal */}
      {targetedUserForEdit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTargetedUserForEdit(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-3xl p-8 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t('admin.edit_user', 'Edit User')}</h3>
              <button onClick={() => setTargetedUserForEdit(null)} className="btn btn-circle btn-ghost btn-sm bg-base-200"><CloseIcon /></button>
            </div>
            <form onSubmit={dispatchUserUpdateMutation} className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.full_name', 'Full Name')}</span></label>
                  <input type="text" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.full_name} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, full_name: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.alias', 'Alias')}</span></label>
                  <input type="text" maxLength={15} className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.alias} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, alias: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.email', 'Email')}</span></label>
                  <input type="email" autoComplete="off" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.email} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, email: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-error/80">{t('admin.password', 'Password')}</span></label>
                  <input type="password" autoComplete="new-password" placeholder={t('admin.password_ph_edit', 'Leave empty to keep current')} className="input input-bordered w-full bg-base-100 rounded-xl border-error/30 focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.password} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, password: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.profession', 'Job Title')}</span></label>
                  <input type="text" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.work} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, work: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.phone', 'Phone')}</span></label>
                  <input type="text" className="input input-bordered w-full bg-base-100 rounded-xl border-base-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm h-12 shadow-sm transition-all" value={targetedUserForEdit.phoneNumber} onChange={e => setTargetedUserForEdit({ ...targetedUserForEdit, phoneNumber: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.role', 'Role')}</span></label>
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
                
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 12 }} className="text-secondary" /><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.personal_location', 'Default Location')}</span></label>
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
              <div className="flex justify-end mt-6 pt-5 border-t border-base-200">
                <button type="submit" className="btn btn-primary w-full sm:w-auto px-12 h-12 min-h-0 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"><SaveIcon fontSize="small" className="mr-2" /> {t('admin.save', 'Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Modal */}
      {deletionConfirmationTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setDeletionConfirmationTarget(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-md p-8 relative z-10 animate-fade-in-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6 animate-pulse"><WarningAmberIcon sx={{ fontSize: 40 }} /></div>
              <h3 className="text-2xl font-black mb-2">{t('admin.confirm_deletion', 'Confirm Deletion')}</h3>
              <p className="text-base-content/60 mb-8">{t('admin.deletion_warning', 'This action is permanent and cannot be undone.')}</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeletionConfirmationTarget(null)} className="btn flex-1 rounded-xl font-black uppercase tracking-widest border-base-300">{t('calendar.cancel', 'Cancel')}</button>
                <button onClick={commitDeletionSequence} className="btn btn-error flex-1 rounded-xl font-black uppercase tracking-widest text-error-content shadow-lg shadow-error/20">{t('admin.delete', 'Delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
