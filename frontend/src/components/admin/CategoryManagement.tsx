import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { API_URL } from '../../config';
import { getDynamicCategoryName, getCategoryIcon, getCategoryColorClass, ALLOWED_ICON_NAMES } from '../../utils/categoryUtils';
import { type Category } from '../../types';

import CategoryIcon from '@mui/icons-material/Category';
import AddBoxIcon from '@mui/icons-material/AddBox';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

export const CategoryManagement = () => {
  const { t, i18n } = useTranslation();
  const { categories, token, fetchGlobalData } = useStore();

  const [newCategoryPayload, setNewCategoryPayload] = useState({
    name: '', name_en: '', name_es: '', icon: 'Business'
  });

  const [targetedCategoryForEdit, setTargetedCategoryForEdit] = useState<Category | null>(null);
  const [deletionConfirmationTarget, setDeletionConfirmationTarget] = useState<number | null>(null);
  const [isCategoryIconDropdownOpen, setIsCategoryIconDropdownOpen] = useState(false);

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

  const commitDeletionSequence = async () => {
    if (!token || !deletionConfirmationTarget) return;
    try {
      const networkResponse = await fetch(`${API_URL}/categories/${deletionConfirmationTarget}`, {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Create Category Form */}
      <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 border border-base-300 shadow-lg border-t-4 border-t-secondary/30">
        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2"><AddBoxIcon className="text-secondary" /> {t('admin.new_category', 'New Category')}</h2>
        <form onSubmit={dispatchCategoryCreation} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_base', 'Category Name')}</span></label>
              <input type="text" placeholder={t('admin.cat_ph_base', 'Category Name')} className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={newCategoryPayload.name} onChange={e => setNewCategoryPayload({ ...newCategoryPayload, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_en', 'Name (EN)')}</span></label>
              <input type="text" placeholder={t('admin.cat_ph_en', 'Name (EN)')} className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={newCategoryPayload.name_en} onChange={e => setNewCategoryPayload({ ...newCategoryPayload, name_en: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_es', 'Name (ES)')}</span></label>
              <input type="text" placeholder={t('admin.cat_ph_es', 'Name (ES)')} className="input input-sm input-bordered bg-base-100 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-medium text-sm h-11 w-full" value={newCategoryPayload.name_es} onChange={e => setNewCategoryPayload({ ...newCategoryPayload, name_es: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.icon', 'Icon')}</span></label>
              <div className="relative">
                {isCategoryIconDropdownOpen && <div className="fixed inset-0 z-[100]" onClick={() => setIsCategoryIconDropdownOpen(false)}></div>}
                <button type="button" onClick={() => setIsCategoryIconDropdownOpen(!isCategoryIconDropdownOpen)} className="flex items-center justify-center input input-sm input-bordered rounded-xl w-full h-11 text-2xl bg-base-100 cursor-pointer hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors relative z-[10]">{getCategoryIcon(newCategoryPayload.icon)}</button>
                {isCategoryIconDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-64 max-h-64 overflow-y-auto grid grid-cols-4 gap-2 z-[110] animate-fade-in">
                    {ALLOWED_ICON_NAMES.map(glyphName => <div key={glyphName} className="flex justify-center"><button type="button" className={`flex items-center justify-center p-2 rounded-xl text-3xl transition-all w-12 h-12 ${newCategoryPayload.icon === glyphName ? 'bg-primary text-primary-content shadow-md scale-105' : 'hover:bg-base-200 text-base-content/80'}`} onClick={() => { setNewCategoryPayload({ ...newCategoryPayload, icon: glyphName }); setIsCategoryIconDropdownOpen(false); }} title={glyphName}>{getCategoryIcon(glyphName)}</button></div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-5 border-t border-base-200">
            <button type="submit" className="btn btn-secondary h-11 min-h-0 px-12 rounded-xl font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all w-full sm:w-auto">{t('admin.create', 'Create')}</button>
          </div>
        </form>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {categories.map(renderedCategory => (
          <div key={renderedCategory.id_category} className="bg-base-100 flex flex-col p-5 border-2 border-base-300 rounded-[1.5rem] hover:border-secondary/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{background: 'linear-gradient(135deg, color-mix(in oklch, oklch(var(--s)) 5%, transparent) 0%, transparent 70%)'}}></div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-base-100/90 backdrop-blur-sm rounded-xl p-1 z-10 shadow-sm">
              <button onClick={() => setTargetedCategoryForEdit(renderedCategory)} className="btn btn-ghost btn-xs btn-circle text-info hover:bg-info/10"><EditIcon sx={{ fontSize: 14 }} /></button>
              <button onClick={() => setDeletionConfirmationTarget(renderedCategory.id_category)} className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"><DeleteIcon sx={{ fontSize: 14 }} /></button>
            </div>
            <div className="mb-4 mt-1 relative z-10">
              <div className={`text-4xl flex items-center justify-center w-16 h-16 bg-base-200 group-hover:bg-secondary/10 rounded-2xl border-2 border-base-300 group-hover:border-secondary/30 transition-all shadow-sm ${getCategoryColorClass(renderedCategory)}`}>
                {getCategoryIcon(renderedCategory.icon)}
              </div>
            </div>
            <span className="text-sm font-black truncate text-base-content pr-8 relative z-10 group-hover:text-secondary transition-colors">{getDynamicCategoryName(renderedCategory, i18n.language, t)}</span>
          </div>
        ))}
      </div>

      {/* Edit Category Modal */}
      {targetedCategoryForEdit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTargetedCategoryForEdit(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-lg p-8 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">{t('admin.edit_category', 'Edit Category')}</h3>
              <button onClick={() => setTargetedCategoryForEdit(null)} className="btn btn-circle btn-ghost btn-sm bg-base-200"><CloseIcon /></button>
            </div>
            <form onSubmit={dispatchCategoryUpdateMutation} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_base', 'Category Name')}</span></label>
                <input type="text" className="input input-bordered bg-base-100 rounded-xl focus:border-primary font-medium text-sm h-12 w-full" value={targetedCategoryForEdit.name} onChange={e => setTargetedCategoryForEdit({ ...targetedCategoryForEdit, name: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_en', 'Name (EN)')}</span></label>
                <input type="text" className="input input-bordered bg-base-100 rounded-xl focus:border-primary font-medium text-sm h-12 w-full" value={targetedCategoryForEdit.name_en || ''} onChange={e => setTargetedCategoryForEdit({ ...targetedCategoryForEdit, name_en: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.cat_name_es', 'Name (ES)')}</span></label>
                <input type="text" className="input input-bordered bg-base-100 rounded-xl focus:border-primary font-medium text-sm h-12 w-full" value={targetedCategoryForEdit.name_es || ''} onChange={e => setTargetedCategoryForEdit({ ...targetedCategoryForEdit, name_es: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.icon', 'Icon')}</span></label>
                <div className="relative">
                  <button type="button" onClick={() => setIsCategoryIconDropdownOpen(!isCategoryIconDropdownOpen)} className="flex items-center justify-center input input-bordered rounded-xl w-full h-12 text-3xl bg-base-100 cursor-pointer">{getCategoryIcon(targetedCategoryForEdit.icon)}</button>
                  {isCategoryIconDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full max-h-64 overflow-y-auto grid grid-cols-6 gap-2 z-[110] animate-fade-in">
                      {ALLOWED_ICON_NAMES.map(glyphName => <button key={glyphName} type="button" className={`flex items-center justify-center p-2 rounded-xl text-3xl transition-all ${targetedCategoryForEdit.icon === glyphName ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`} onClick={() => { setTargetedCategoryForEdit({ ...targetedCategoryForEdit, icon: glyphName }); setIsCategoryIconDropdownOpen(false); }}>{getCategoryIcon(glyphName)}</button>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t border-base-200">
                <button type="submit" className="btn btn-primary w-full sm:w-auto px-12 h-12 rounded-xl font-black uppercase tracking-widest shadow-md"><SaveIcon fontSize="small" className="mr-2" /> {t('admin.save', 'Save')}</button>
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
