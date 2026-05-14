import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { type User, type Category } from '../types';
import { getDynamicCategoryName, getCategoryIcon } from '../utils/categoryUtils';
import { useStore } from '../store/useStore';

import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SearchIcon from '@mui/icons-material/Search';

export const ExportModal = (props: any) => {
  const { t, i18n } = useTranslation();
  const store = useStore();

  const users: User[] = props.users || store.users || [];
  const categories: Category[] = props.categories || store.categories || [];
  const onClose = props.onClose;

  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [calendarViewDate, setCalendarViewDate] = useState(dayjs().startOf('month'));

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [userSearch, setUserSearch] = useState('');

  const availableDepartments = useMemo(() => {
    return [...new Set(users.map(u => u.department).filter(Boolean))] as string[];
  }, [users]);

  const toggleUser = (id: number) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const visibleUsers = useMemo(() => {
    return users.filter(u => selectedDepartments.length === 0 || (u.department && selectedDepartments.includes(u.department)));
  }, [users, selectedDepartments]);

  const areAllUsersSelected = visibleUsers.length > 0 && selectedUsers.length === visibleUsers.length;

  const handleSelectAllUsers = () => {
    if (areAllUsersSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(visibleUsers.map(u => u.id_user));
    }
  };

  const handleDateClick = (clickedDate: dayjs.Dayjs) => {
    const formattedClick = clickedDate.format('YYYY-MM-DD');
    if (!startDate || (startDate && endDate)) {
      setStartDate(formattedClick);
      setEndDate('');
    } else if (startDate && !endDate) {
      if (clickedDate.isBefore(dayjs(startDate), 'day')) {
        setStartDate(formattedClick);
      } else {
        setEndDate(formattedClick);
      }
    }
  };

  const startOfGrid = calendarViewDate.startOf('month').startOf('isoWeek');
  const endOfGrid = calendarViewDate.endOf('month').endOf('isoWeek');
  const calendarDays = [];
  let dayIterator = startOfGrid;
  while (dayIterator.isBefore(endOfGrid) || dayIterator.isSame(endOfGrid, 'day')) {
    calendarDays.push(dayIterator);
    dayIterator = dayIterator.add(1, 'day');
  }

  const handleExport = () => {
    const sDate = dayjs(startDate);
    const eDate = endDate ? dayjs(endDate) : dayjs(startDate);
    const allRecords: any[] = [];

    users
      .filter(u => selectedUsers.includes(u.id_user))
      .forEach(u => {
        (u.presences || []).forEach((p: any) => {
          const pDate = dayjs(p.date);
          const inDateRange = (pDate.isAfter(sDate) || pDate.isSame(sDate, 'day')) &&
            (pDate.isBefore(eDate) || pDate.isSame(eDate, 'day'));
          const inCategory = selectedCategories.length === 0 ||
            (p.categories && selectedCategories.includes(p.categories.id_category));

          if (inDateRange && inCategory) {
            allRecords.push({
              date: p.date,
              dayName: pDate.locale(i18n.language).format('ddd'),
              employee: u.alias || u.full_name,
              department: u.department || '',
              work: u.work || '',
              category: p.categories ? getDynamicCategoryName(p.categories, i18n.language, t) : '',
              rawDate: pDate.valueOf()
            });
          }
        });
      });

    allRecords.sort((a, b) => a.rawDate - b.rawDate || a.employee.localeCompare(b.employee));

    if (exportFormat === 'json') {
      const dataStr = JSON.stringify(allRecords, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      triggerDownload(blob, `FAE_Export_${dayjs().format('YYYYMMDD')}.json`);
    } else {
      const hDate = i18n.language === 'es' ? 'Fecha' : i18n.language === 'en' ? 'Date' : 'Fecha';
      const hDay = i18n.language === 'es' ? 'Día' : i18n.language === 'en' ? 'Day' : 'Día';
      const hEmp = i18n.language === 'es' ? 'Empleado' : i18n.language === 'en' ? 'Employee' : 'Empleado';
      const hDept = i18n.language === 'es' ? 'Departamento' : i18n.language === 'en' ? 'Department' : 'Departamento';
      const hRole = i18n.language === 'es' ? 'Rol' : i18n.language === 'en' ? 'Role' : 'Rol';
      const hCat = i18n.language === 'es' ? 'Categoría' : i18n.language === 'en' ? 'Category' : 'Categoría';

      let csv = `${hDate},${hDay},${hEmp},${hDept},${hRole},${hCat}\n`;
      allRecords.forEach(r => {
        csv += `"${r.date}","${r.dayName}","${r.employee}","${r.department}","${r.work}","${r.category}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, `FAE_Export_${dayjs().format('YYYYMMDD')}.csv`);
    }
    if (onClose) onClose();
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dayNamesRaw = t('profile.days', { returnObjects: true });
  const finalDayNames = Array.isArray(dayNamesRaw) ? dayNamesRaw : ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300 w-full max-w-4xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
        <div className="p-6 md:p-8 border-b border-base-300 flex justify-between items-center bg-base-200/30">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-base-content flex items-center gap-3">
              <FileDownloadIcon className="text-primary" fontSize="large" />
              {t('export.title', 'EXPORTAR DATOS')}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-circle btn-ghost text-base-content/50 hover:text-base-content hover:bg-base-300">
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          <div className="w-full md:w-[350px] p-6 border-b md:border-b-0 md:border-r border-base-300 bg-base-200/20">
            <h4 className="text-xs font-black uppercase tracking-widest text-base-content/70 mb-4 text-center">{t('export.date_range', 'Selecciona las fechas')}</h4>

            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm w-full select-none">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCalendarViewDate(d => d.subtract(1, 'month'))} className="btn btn-sm btn-ghost btn-circle text-base-content/70"><KeyboardArrowLeftIcon /></button>
                <span className="font-bold uppercase tracking-widest text-xs">{calendarViewDate.locale(i18n.language).format('MMMM YYYY')}</span>
                <button onClick={() => setCalendarViewDate(d => d.add(1, 'month'))} className="btn btn-sm btn-ghost btn-circle text-base-content/70"><KeyboardArrowRightIcon /></button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {finalDayNames.map((d: string) => (
                  <div key={d} className="text-center text-[10px] font-bold uppercase text-base-content/50">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map(d => {
                  const dateStr = d.format('YYYY-MM-DD');
                  const isStart = dateStr === startDate;
                  const isEnd = dateStr === endDate;
                  const isBetween = startDate && endDate && d.isAfter(startDate) && d.isBefore(endDate);
                  const isCurrentMonth = d.month() === calendarViewDate.month();

                  let bgClass = "bg-transparent hover:bg-base-200";
                  let textClass = isCurrentMonth ? "text-base-content" : "text-base-content/30";
                  let roundedClass = "rounded-xl";

                  if (isStart) {
                    bgClass = "bg-primary";
                    textClass = "text-primary-content font-bold";
                    if (endDate) roundedClass = "rounded-l-xl rounded-r-none";
                  } else if (isEnd) {
                    bgClass = "bg-primary";
                    textClass = "text-primary-content font-bold";
                    if (startDate) roundedClass = "rounded-r-xl rounded-l-none";
                  } else if (isBetween) {
                    bgClass = "bg-primary/10";
                    textClass = "text-primary font-bold";
                    roundedClass = "rounded-none";
                  }

                  return (
                    <div key={dateStr} className={`w-full flex justify-center ${isBetween ? 'bg-primary/10' : ''}`}>
                      <button
                        onClick={() => handleDateClick(d)}
                        className={`w-8 h-8 flex items-center justify-center text-xs transition-colors ${bgClass} ${textClass} ${roundedClass}`}
                      >
                        {d.date()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-[10px] font-bold uppercase text-base-content/50 mb-1">{t('export.from', 'Desde')} - {t('export.to', 'Hasta')}</div>
              <div className="font-semibold text-sm text-primary">
                {dayjs(startDate).locale(i18n.language).format('DD MMM YYYY')}
                {endDate && `  →  ${dayjs(endDate).locale(i18n.language).format('DD MMM YYYY')}`}
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 md:p-8 space-y-8">
            {availableDepartments.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-3 px-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-base-content/70">{t('admin.department', 'Departamentos')}</h4>
                  <button type="button" onClick={() => setSelectedDepartments([])} className="text-[10px] font-bold uppercase text-primary hover:underline">{t('export.select_all', 'Borrar')}</button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-base-200/50 rounded-2xl border border-base-300">
                  {availableDepartments.map(dept => (
                    <label key={dept} className={`flex items-center gap-2 p-2 px-4 rounded-full border cursor-pointer transition-all ${selectedDepartments.length === 0 || selectedDepartments.includes(dept) ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 bg-base-100 hover:border-primary/50 text-base-content/70 hover:bg-base-200'}`}>
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-primary hidden" checked={selectedDepartments.length === 0 || selectedDepartments.includes(dept)} onChange={() => toggleDepartment(dept)} />
                      <span className="text-xs font-bold uppercase">{dept}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex justify-between items-end mb-3 px-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-base-content/70">{t('export.employees', 'Users')}</h4>
                <div className="flex gap-4">
                  <button type="button" onClick={handleSelectAllUsers} className="text-[10px] font-bold uppercase text-primary hover:underline">
                    
                    {areAllUsersSelected ? t('export.unselect_all', 'Deselect All') : t('export.select_all', 'Select All')}
                  </button>
                  <button type="button" onClick={() => setSelectedUsers([])} className="text-[10px] font-bold uppercase text-base-content/50 hover:text-base-content hover:underline">
                    
                    {t('export.clear', 'Clear')}
                  </button>
                </div>
              </div>
              <div className="relative mb-3">
                <SearchIcon fontSize="small" className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  className="input input-sm w-full pl-9 bg-base-100 border border-base-300 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-xs h-9"
                  placeholder={t('calendar.search', 'Buscar empleado...')}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 rounded-2xl border border-base-300 bg-base-200/50">
                {visibleUsers
                  .filter(u => (u.alias || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => (
                    <label key={u.id_user} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selectedUsers.includes(u.id_user) ? 'bg-primary/5 text-primary border-primary/50' : 'bg-base-100 hover:bg-base-300 text-base-content/70 border-transparent'}`}>
                      <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={selectedUsers.includes(u.id_user)} onChange={() => toggleUser(u.id_user)} />
                      <span className="text-sm font-bold truncate">{u.alias || u.full_name}</span>
                    </label>
                  ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-end mb-3 px-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-base-content/70">{t('export.categories', 'Categorías')}</h4>
                <button type="button" onClick={() => setSelectedCategories([])} className="text-[10px] font-bold uppercase text-primary hover:underline">{t('export.select_all', 'Borrar')}</button>
              </div>
              <div className="flex flex-wrap gap-2.5 p-3 bg-base-200/50 rounded-2xl border border-base-300">
                {categories.map(c => (
                  <label key={c.id_category} className={`flex items-center gap-2 p-2 px-3 rounded-full border cursor-pointer transition-all ${selectedCategories.length === 0 || selectedCategories.includes(c.id_category) ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 bg-base-100 hover:border-primary/50 text-base-content/70 hover:bg-base-200'}`}>
                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary hidden" checked={selectedCategories.length === 0 || selectedCategories.includes(c.id_category)} onChange={() => toggleCategory(c.id_category)} />
                    <span className="text-base-content/50 scale-90">{getCategoryIcon(c)}</span>
                    <span className="text-xs font-bold uppercase truncate">{getDynamicCategoryName(c, i18n.language, t)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-base-content/70 mb-3 px-1">{t('export.export_format', 'FORMATO DE EXPORTACIÓN')}</h4>
              <div className="flex gap-4">
                <button onClick={() => setExportFormat('csv')} className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${exportFormat === 'csv' ? 'border-[#107c41] bg-[#107c41]/10 text-[#107c41] shadow-md' : 'border-base-300 bg-base-100 hover:border-[#107c41]/50 text-base-content/60 hover:bg-base-200'}`}>
                  <InsertDriveFileIcon fontSize="large" className="mb-2" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">CSV</span>
                </button>
                <button onClick={() => setExportFormat('json')} className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${exportFormat === 'json' ? 'border-secondary bg-secondary/10 text-secondary shadow-md' : 'border-base-300 bg-base-100 hover:border-secondary/50 text-base-content/60 hover:bg-base-200'}`}>
                  <DataObjectIcon fontSize="large" className="mb-2" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">JSON</span>
                </button>
              </div>
            </section>

          </div>
        </div>

        <div className="p-6 border-t border-base-300 bg-base-200/50 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="btn btn-ghost rounded-xl font-bold uppercase text-xs tracking-wider">{t('export.cancel', 'CANCELAR')}</button>
          <button onClick={handleExport} disabled={selectedUsers.length === 0} className="btn btn-primary rounded-xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-md hover:shadow-lg disabled:opacity-50">{t('export.generate', 'EXPORTAR DATOS')}</button>
        </div>
      </div>
    </div>
  );
};