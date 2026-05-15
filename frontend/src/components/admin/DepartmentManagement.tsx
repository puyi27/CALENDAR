import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { API_URL } from '../../config';
import { getDynamicCategoryName } from '../../utils/categoryUtils';
import { CustomSelect } from './CustomSelect';

import BusinessIcon from '@mui/icons-material/Business';
import AddBoxIcon from '@mui/icons-material/AddBox';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';
import SendIcon from '@mui/icons-material/Send';


export const DepartmentManagement = ({ registeredDepartments }: { registeredDepartments: any[] }) => {
  const { t, i18n } = useTranslation();
  const { categories, token, fetchGlobalData } = useStore();

  const [newDepartmentPayload, setNewDepartmentPayload] = useState({
    name: '', webhook_url: '', default_category_id: ''
  });

  const [targetedDepartmentForEdit, setTargetedDepartmentForEdit] = useState<any>(null);
  const [deletionConfirmationTarget, setDeletionConfirmationTarget] = useState<string | null>(null);

  const validDepartmentCategories = useMemo(() => {
    return categories.filter(c => {
      const icon = c.icon || '';
      const name = (c.name || '').toLowerCase();
      return icon !== 'BeachAccess' && icon !== 'Sick' && icon !== 'Flight' && 
             !name.includes('ferie') && !name.includes('malattia') && !name.includes('travel') && !name.includes('trasferta');
    });
  }, [categories]);

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

  const commitDeletionSequence = async () => {
    if (!token || !deletionConfirmationTarget) return;
    try {
      const networkResponse = await fetch(`${API_URL}/departments/${deletionConfirmationTarget}`, {
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

  const dispatchWebhookTest = async (webhookUrl: string) => {
    if (!token || !webhookUrl) {
      toast.error(t('admin.err_no_webhook', 'No Webhook URL configured'));
      return;
    }
    
    const loadingToast = toast.loading(t('admin.testing_webhook', 'Testing webhook...'));
    try {
      const networkResponse = await fetch(`${API_URL}/departments/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ webhook_url: webhookUrl })
      });

      toast.dismiss(loadingToast);
      if (networkResponse.ok) {
        toast.success(t('admin.webhook_success', 'Test card sent successfully!'));
      } else {
        toast.error(t('admin.webhook_error', 'Failed to send test card'));
      }
    } catch (networkException) {
      toast.dismiss(loadingToast);
      toast.error(t('admin.err_network', 'Network error'));
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Create Department Form */}
      <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 border border-base-300 shadow-lg">
        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2"><BusinessIcon className="text-accent" /> {t('admin.new_department', 'New Department')}</h2>
        <form onSubmit={dispatchDepartmentCreation} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.department_name', 'Department Name')}</span></label>
              <input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 font-medium text-sm h-11 w-full uppercase" placeholder="HUB, BIGTECH" value={newDepartmentPayload.name} onChange={e => setNewDepartmentPayload({ ...newDepartmentPayload, name: e.target.value.toUpperCase() })} required />
            </div>
            
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

            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.webhook_url', 'Webhook URL')}</span></label>
              <input type="url" className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 font-medium text-sm h-11 w-full" placeholder="https://..." value={newDepartmentPayload.webhook_url} onChange={e => setNewDepartmentPayload({ ...newDepartmentPayload, webhook_url: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-5 border-t border-base-200">
            <button type="submit" className="btn btn-accent h-11 min-h-0 px-12 rounded-xl font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all w-full sm:w-auto">{t('admin.create', 'Create')}</button>
          </div>
        </form>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registeredDepartments.map(renderedDepartment => (
          <div key={renderedDepartment.name} className="bg-base-100 flex flex-col p-6 border border-base-300 rounded-[1.5rem] hover:border-accent hover:shadow-md transition-all group relative">
            <div className="absolute top-4 right-4 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-base-100/80 backdrop-blur-sm rounded-lg p-1 z-10">
              <button onClick={() => dispatchWebhookTest(renderedDepartment.webhook_url)} className="btn btn-ghost btn-xs btn-circle text-accent hover:bg-accent/10" title={t('admin.test_webhook', 'Test Webhook')} disabled={!renderedDepartment.webhook_url}><SendIcon fontSize="small" /></button>
              <button onClick={() => setTargetedDepartmentForEdit(renderedDepartment)} className="btn btn-ghost btn-xs btn-circle text-info hover:bg-info/10"><EditIcon fontSize="small" /></button>
              <button onClick={() => setDeletionConfirmationTarget(renderedDepartment.name)} className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"><DeleteIcon fontSize="small" /></button>
            </div>

            <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center"><BusinessIcon /></div><span className="text-xl font-black truncate text-base-content uppercase tracking-widest pr-10">{renderedDepartment.name}</span></div>
            <div className="flex flex-col gap-1 mt-2 p-3 bg-base-200/50 rounded-xl border border-base-300/50"><span className="text-[10px] font-bold uppercase text-base-content/50 flex items-center gap-1"><LocationOnIcon fontSize="small" /> {t('admin.category_name', 'Default Location')}</span><span className="text-xs font-bold text-base-content/80">{renderedDepartment.category_name || <span className="italic text-base-content/40">---</span>}</span></div>
            <div className="flex flex-col gap-1 mt-2 p-3 bg-base-200/50 rounded-xl border border-base-300/50"><span className="text-[10px] font-bold uppercase text-base-content/50 flex items-center gap-1"><LinkIcon fontSize="small" /> {t('admin.webhook_url', 'Webhook URL')}</span><span className="text-xs font-mono truncate text-base-content/80" title={renderedDepartment.webhook_url || '---'}>{renderedDepartment.webhook_url || <span className="italic text-base-content/40">---</span>}</span></div>
          </div>
        ))}
      </div>

      {/* Edit Department Modal */}
      {targetedDepartmentForEdit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTargetedDepartmentForEdit(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-lg p-8 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t('admin.edit_department', 'Edit Department')}</h3>
              <button onClick={() => setTargetedDepartmentForEdit(null)} className="btn btn-circle btn-ghost btn-sm bg-base-200"><CloseIcon /></button>
            </div>
            <form onSubmit={dispatchDepartmentUpdateMutation} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.department_name', 'Department Name')}</span></label>
                <div className="h-12 flex items-center px-4 bg-base-200 rounded-xl border border-base-300 font-bold text-sm uppercase tracking-widest text-base-content/50">{targetedDepartmentForEdit.name}</div>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1 flex items-center gap-1"><LocationOnIcon sx={{ fontSize: 12 }} className="text-accent" /><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.category_name', 'Default Location')}</span></label>
                <CustomSelect
                  value={targetedDepartmentForEdit.default_category_id || ''}
                  onChange={(val: string) => setTargetedDepartmentForEdit({ ...targetedDepartmentForEdit, default_category_id: val })}
                  options={[
                    { value: '', label: '---' },
                    ...validDepartmentCategories.map(c => ({ value: c.id_category, label: getDynamicCategoryName(c, i18n.language, t) }))
                  ]}
                  className="h-12 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.webhook_url', 'Webhook URL')}</span></label>
                <input type="url" className="input input-bordered bg-base-100 rounded-xl focus:border-accent font-medium text-sm h-12 w-full" value={targetedDepartmentForEdit.webhook_url || ''} onChange={e => setTargetedDepartmentForEdit({ ...targetedDepartmentForEdit, webhook_url: e.target.value })} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-base-200">
                <button type="button" onClick={() => dispatchWebhookTest(targetedDepartmentForEdit.webhook_url)} className="btn btn-outline btn-accent flex-1 h-12 rounded-xl font-black uppercase tracking-widest" disabled={!targetedDepartmentForEdit.webhook_url}><SendIcon fontSize="small" className="mr-2" /> {t('admin.test', 'Test')}</button>
                <button type="submit" className="btn btn-accent flex-1 h-12 rounded-xl font-black uppercase tracking-widest shadow-md"><SaveIcon fontSize="small" className="mr-2" /> {t('admin.save', 'Save')}</button>
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
