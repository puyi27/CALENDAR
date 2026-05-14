import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { API_URL } from '../../config';
import dayjs from 'dayjs';

import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const HolidayManagement = ({ holidays, fetchHolidays }: { holidays: any[], fetchHolidays: () => void }) => {
  const { t, i18n } = useTranslation();
  const { token } = useStore();

  const [newHolidayPayload, setNewHolidayPayload] = useState({
    date: dayjs().format('YYYY-MM-DD'), name_holiday: ''
  });

  const [deletionConfirmationTarget, setDeletionConfirmationTarget] = useState<string | null>(null);

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
    try {
      const networkResponse = await fetch(`${API_URL}/holidays/${deletionConfirmationTarget}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (networkResponse.ok) {
        fetchHolidays();
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
                 <button onClick={() => setDeletionConfirmationTarget(h.date)} className="btn btn-ghost btn-sm btn-circle text-base-content/30 group-hover:text-error hover:bg-error/10 shrink-0"><DeleteIcon fontSize="small" /></button>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Deletion Modal */}
      {deletionConfirmationTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setDeletionConfirmationTarget(null)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-md p-8 relative z-10 animate-fade-in-up">
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
