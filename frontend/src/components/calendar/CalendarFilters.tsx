import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TodayIcon from '@mui/icons-material/Today';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getDynamicCategoryName, getCategoryIcon } from '../../utils/categoryUtils';
import { type Category } from '../../types';
import dayjs from 'dayjs';

interface CalendarFiltersProps {
  searchQueryString: string;
  setSearchQueryString: (val: string) => void;
  selectedDepartmentFilter: string;
  setSelectedDepartmentFilter: (val: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (val: string) => void;
  uniqueActiveDepartments: string[];
  categories: Category[];
  activeDropdownContext: 'dept' | 'cat' | null;
  setActiveDropdownContext: (val: 'dept' | 'cat' | null) => void;
  referenceDateObject: dayjs.Dayjs;
  setReferenceDateObject: (val: any) => void;
  triggerResetToPresentDate: () => void;
  initialWeeklyBound: dayjs.Dayjs;
  terminalWeeklyBound: dayjs.Dayjs;
}

export const CalendarFilters = ({
  searchQueryString,
  setSearchQueryString,
  selectedDepartmentFilter,
  setSelectedDepartmentFilter,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  uniqueActiveDepartments,
  categories,
  activeDropdownContext,
  setActiveDropdownContext,
  referenceDateObject,
  setReferenceDateObject,
  triggerResetToPresentDate,
  initialWeeklyBound,
  terminalWeeklyBound
}: CalendarFiltersProps) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 bg-base-100 p-5 rounded-[2rem] border border-base-300 shadow-xl relative z-[90]" style={{background: 'linear-gradient(135deg, var(--fallback-b1,oklch(var(--b1))) 60%, color-mix(in oklch, oklch(var(--p)) 3%, var(--fallback-b1,oklch(var(--b1)))))', borderTop: '4px solid color-mix(in oklch, oklch(var(--p)) 40%, transparent)'}}>
      {activeDropdownContext && <div className="fixed inset-0 z-[95]" onClick={() => setActiveDropdownContext(null)}></div>}
      
      <div className={`w-full flex flex-col gap-2 relative ${activeDropdownContext ? 'z-[10]' : 'z-[20]'}`}>
        <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 ml-2">{t('calendar.search_label', 'Search')}</label>
        <div className="relative w-full">
          <input type="text" placeholder={t('calendar.search', 'Search')} className="input w-full pl-11 bg-base-200 border border-base-300 focus:border-primary focus:ring-1 focus:ring-primary rounded-[1.25rem] text-sm transition-all h-12 shadow-inner" value={searchQueryString} onChange={(e) => setSearchQueryString(e.target.value)} />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content opacity-50"><SearchIcon fontSize="small" /></span>
        </div>
      </div>
      
      <div className={`w-full flex flex-col gap-2 relative ${activeDropdownContext === 'dept' ? 'z-[100]' : 'z-[10]'}`}>
        <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 ml-2">{t('admin.department', 'Department')}</label>
        <div className="relative w-full">
          <button type="button" onClick={() => setActiveDropdownContext(activeDropdownContext === 'dept' ? null : 'dept')} className="btn btn-ghost h-12 min-h-0 bg-base-200 border border-base-300 rounded-[1.25rem] w-full flex justify-between px-4 text-xs font-bold shadow-inner">
            <span className="flex items-center gap-2 truncate"><BusinessIcon sx={{ fontSize: 16 }} className="text-primary" />{selectedDepartmentFilter === 'ALL' ? t('admin.all_depts', 'All Departments') : selectedDepartmentFilter}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 transition-transform duration-200 ${activeDropdownContext === 'dept' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {activeDropdownContext === 'dept' && (
            <div className="absolute top-full left-0 mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full flex flex-col gap-1 animate-fade-in-up max-h-64 overflow-y-auto">
              <button type="button" className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedDepartmentFilter === 'ALL' ? 'bg-primary text-primary-content' : 'hover:bg-base-200 text-base-content'}`} onClick={() => { setSelectedDepartmentFilter('ALL'); setActiveDropdownContext(null); }}>{t('admin.all_depts', 'All Departments')}</button>
              <div className="w-full h-px bg-base-300 my-0.5"></div>
              {uniqueActiveDepartments.map(d => <button type="button" key={d} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase ${selectedDepartmentFilter === d ? 'bg-primary text-primary-content' : 'hover:bg-base-200 text-base-content'}`} onClick={() => { setSelectedDepartmentFilter(d); setActiveDropdownContext(null); }}>{d}</button>)}
            </div>
          )}
        </div>
      </div>

      <div className={`w-full flex flex-col gap-2 relative ${activeDropdownContext === 'cat' ? 'z-[100]' : 'z-[10]'}`}>
        <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 ml-2">{t('calendar.categories_filter', 'Categories')}</label>
        <div className="relative w-full">
          <button type="button" onClick={() => setActiveDropdownContext(activeDropdownContext === 'cat' ? null : 'cat')} className="btn btn-ghost h-12 min-h-0 bg-base-200 border border-base-300 rounded-[1.25rem] w-full flex justify-between px-4 text-xs font-bold shadow-inner">
            <span className="flex items-center gap-2 truncate"><FilterAltIcon sx={{ fontSize: 16 }} className="text-secondary" />{selectedCategoryFilter === 'ALL' ? t('calendar.all_categories', 'All Categories') : getDynamicCategoryName(categories?.find(c => String(c.id_category) === String(selectedCategoryFilter)), i18n.language, t)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 transition-transform duration-200 ${activeDropdownContext === 'cat' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {activeDropdownContext === 'cat' && (
            <div className="absolute top-full left-0 sm:right-0 mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full sm:w-auto min-w-[250px] max-h-64 overflow-y-auto flex flex-col gap-1 animate-fade-in-up">
              <button type="button" className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedCategoryFilter === 'ALL' ? 'bg-secondary text-secondary-content' : 'hover:bg-base-200 text-base-content'}`} onClick={() => { setSelectedCategoryFilter('ALL'); setActiveDropdownContext(null); }}>{t('calendar.all_categories', 'All Categories')}</button>
              <div className="w-full h-px bg-base-300 my-0.5"></div>
              {categories.map(c => <button type="button" key={c.id_category} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${selectedCategoryFilter === String(c.id_category) ? 'bg-secondary text-secondary-content' : 'hover:bg-base-200 text-base-content'}`} onClick={() => { setSelectedCategoryFilter(String(c.id_category)); setActiveDropdownContext(null); }}><span className="text-xl flex items-center justify-center opacity-80">{getCategoryIcon(c.icon)}</span><span className="truncate">{getDynamicCategoryName(c, i18n.language, t)}</span></button>)}
            </div>
          )}
        </div>
      </div>
      
      <div className={`w-full flex flex-col gap-2 relative ${activeDropdownContext ? 'z-[10]' : 'z-[20]'}`}>
        <div className="flex justify-between items-center px-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 flex items-center gap-1"><DateRangeIcon sx={{ fontSize: 12 }} /> {t('calendar.visible_week', 'Visible Week')}</label>
          <button onClick={triggerResetToPresentDate} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"><TodayIcon sx={{ fontSize: 12 }} /> {t('calendar.today', 'Today')}</button>
        </div>
        <div className="flex items-center justify-between gap-2 bg-base-200 px-2 rounded-[1.25rem] border border-base-300 h-12 w-full shadow-inner">
          <button onClick={() => setReferenceDateObject((c: any) => c.subtract(1, 'week'))} className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 text-base-content opacity-70"><KeyboardArrowLeftIcon fontSize="small" /></button>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content text-center flex-1 whitespace-nowrap px-1">{initialWeeklyBound.locale(i18n.language).format('DD MMM')} - {terminalWeeklyBound.locale(i18n.language).format('DD MMM YYYY')}</h3>
          <button onClick={() => setReferenceDateObject((c: any) => c.add(1, 'week'))} className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 text-base-content opacity-70"><KeyboardArrowRightIcon fontSize="small" /></button>
        </div>
      </div>
    </div>
  );
};
