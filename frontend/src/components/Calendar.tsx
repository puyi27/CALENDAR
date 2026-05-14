import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'react-i18next';
import { DayCell } from './DayCell';
import { useStore } from '../store/useStore';
import { API_URL } from '../config';

import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TodayIcon from '@mui/icons-material/Today';
import CelebrationIcon from '@mui/icons-material/Celebration';

import DoNotDisturbOnTotalSilenceIcon from '@mui/icons-material/DoNotDisturbOnTotalSilence';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

import { getDynamicCategoryName, getCategoryIcon, getCategoryColorClass } from '../utils/categoryUtils';

dayjs.extend(isoWeek);

type SortingConfiguration = { metric: 'alias' | 'work' | 'department'; orderingDirection: 'asc' | 'desc' };

const resolveStatusIndicatorIcon = (availabilityStatus?: string) => {
  switch (availabilityStatus) {
    case 'Occupato': return <DoNotDisturbOnTotalSilenceIcon sx={{ fontSize: 14 }} className="text-error" />;
    case 'Smart Working': return <HomeWorkIcon sx={{ fontSize: 14 }} className="text-success" />;
    case 'In Ferie': return <BeachAccessIcon sx={{ fontSize: 14 }} className="text-warning" />;
    case 'Disponibile':
    default: return <OnlinePredictionIcon sx={{ fontSize: 14 }} className="text-success" />;
  }
};

export const Calendar = () => {
  const { t, i18n } = useTranslation();
  const triggerNavigation = useNavigate();
  
  const { users, categories, currentUser, token, setInteractionModalContext } = useStore();

  const [searchQueryString, setSearchQueryString] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>(currentUser?.department || 'ALL');
  
  const [activeDateFilter, setActiveDateFilter] = useState(dayjs().format('YYYY-MM-DD'));
  const [referenceDateObject, setReferenceDateObject] = useState(dayjs());
  const [sortingConfiguration, setSortingConfiguration] = useState<SortingConfiguration>({ metric: 'alias', orderingDirection: 'asc' });
  const [activeMobileViewDate, setActiveMobileViewDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [paginationIndex, setPaginationIndex] = useState(1);
  const [activeDropdownContext, setActiveDropdownContext] = useState<'dept' | 'cat' | null>(null);

  const [overlayContextProperties, setOverlayContextProperties] = useState<{date: string, catName: string, categoryData: any, userName: string, isDefault?: boolean, isHoliday?: boolean} | null>(null);
  const [holidays, setHolidays] = useState<{date: string, name_holiday: string}[]>([]);

  const MAX_RECORDS_PER_PAGE = 25;
  const scrollableMobileContainerRef = useRef<HTMLDivElement>(null);

  const onAddPresence = (userId: number, targetDate: string) => {
    setInteractionModalContext({ id_user: userId, date: targetDate });
  };

  const initialWeeklyBound = useMemo(() => referenceDateObject.startOf('isoWeek'), [referenceDateObject]);
  const terminalWeeklyBound = useMemo(() => referenceDateObject.endOf('isoWeek'), [referenceDateObject]);
  const localizedWeekCollection = useMemo(() => Array.from({ length: 7 }, (_, indexRef) => initialWeeklyBound.add(indexRef, 'day')), [initialWeeklyBound]);

  const extendedMobileDateCollection = useMemo(() => {
    const calculationStartAnchor = referenceDateObject.subtract(30, 'day');
    return Array.from({ length: 65 }, (_, indexRef) => calculationStartAnchor.add(indexRef, 'day'));
  }, [referenceDateObject]);

  const uniqueActiveDepartments = useMemo(() => {
    return [...new Set((users || []).map(u => u.department).filter(Boolean))] as string[];
  }, [users]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/holidays`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHolidays(data || []))
      .catch(() => {});
  }, [token]);

  const executeScrollToTargetDate = (dateIdentifier: string) => {
    setTimeout(() => {
      if (scrollableMobileContainerRef.current) {
        const targetDOMElement = scrollableMobileContainerRef.current.querySelector(`[data-date="${dateIdentifier}"]`);
        if (targetDOMElement) targetDOMElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);
  };

  const triggerResetToPresentDate = () => {
    const presentDateString = dayjs().format('YYYY-MM-DD');
    setReferenceDateObject(dayjs());
    setActiveMobileViewDate(presentDateString);
    setActiveDateFilter(presentDateString);
    executeScrollToTargetDate(presentDateString);
  };

  useEffect(() => {
    const confirmsDateMatchesWeek = localizedWeekCollection.some(d => d.format('YYYY-MM-DD') === activeMobileViewDate);
    if (!confirmsDateMatchesWeek && localizedWeekCollection.length > 0) {
      setActiveMobileViewDate(localizedWeekCollection[0].format('YYYY-MM-DD'));
      setActiveDateFilter(localizedWeekCollection[0].format('YYYY-MM-DD'));
    }
  }, [localizedWeekCollection, activeMobileViewDate]);

  useEffect(() => { executeScrollToTargetDate(activeMobileViewDate); }, [activeMobileViewDate]);

  useEffect(() => { setPaginationIndex(1); }, [searchQueryString, selectedCategoryFilter, selectedDepartmentFilter, activeDateFilter, activeMobileViewDate]);

  const { extractedSelfRecord, sortedPeerCollection } = useMemo(() => {
    let operatingDataset = Array.isArray(users) ? [...users] : [];
    const executesInMobileContext = window.innerWidth < 1024;
    const contextualDateFilter = executesInMobileContext ? activeMobileViewDate : activeDateFilter;

    operatingDataset = operatingDataset.filter(evaluatingUser => {
      const satisfiesSearchCondition = (evaluatingUser.alias || evaluatingUser.full_name || '').toLowerCase().includes(searchQueryString.toLowerCase()) ||
        (evaluatingUser.work && evaluatingUser.work.toLowerCase().includes(searchQueryString.toLowerCase()));
      const satisfiesDepartmentCondition = selectedDepartmentFilter === 'ALL' || evaluatingUser.department === selectedDepartmentFilter;

      if (!satisfiesSearchCondition || !satisfiesDepartmentCondition) return false;

      if (selectedCategoryFilter !== 'ALL') {
        const possessesCategoryInDate = evaluatingUser.presences?.some((pr: any) => {
          return pr.date === contextualDateFilter && String(pr.categories?.id_category) === String(selectedCategoryFilter);
        });
        if (!possessesCategoryInDate) return false;
      }
      return true;
    });

    const parsedSelfRecord = operatingDataset.find(u => u.id_user === currentUser?.id_user) || null;
    const peerDataset = operatingDataset.filter(u => u.id_user !== currentUser?.id_user);

    peerDataset.sort((recordA, recordB) => {
      const evaluationValueA = (recordA[sortingConfiguration.metric] || '').toLowerCase();
      const evaluationValueB = (recordB[sortingConfiguration.metric] || '').toLowerCase();
      if (evaluationValueA < evaluationValueB) return sortingConfiguration.orderingDirection === 'asc' ? -1 : 1;
      if (evaluationValueA > evaluationValueB) return sortingConfiguration.orderingDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return { extractedSelfRecord: parsedSelfRecord, sortedPeerCollection: peerDataset };
  }, [users, searchQueryString, selectedDepartmentFilter, sortingConfiguration, currentUser, selectedCategoryFilter, activeDateFilter, activeMobileViewDate]);

  const triggerSortingExecution = (metricSelector: 'alias' | 'work' | 'department') => {
    const confirmsAscendingState = sortingConfiguration.metric === metricSelector && sortingConfiguration.orderingDirection === 'asc';
    setSortingConfiguration({ metric: metricSelector, orderingDirection: confirmsAscendingState ? 'desc' : 'asc' });
  };

  const calculatedTotalPages = Math.max(1, Math.ceil(sortedPeerCollection.length / MAX_RECORDS_PER_PAGE));
  const isolatedPaginationSlice = sortedPeerCollection.slice((paginationIndex - 1) * MAX_RECORDS_PER_PAGE, paginationIndex * MAX_RECORDS_PER_PAGE);

  const formattedUserDataset = useMemo(() => {
    const combinedOperationalList = extractedSelfRecord ? [extractedSelfRecord, ...isolatedPaginationSlice] : isolatedPaginationSlice;
    return combinedOperationalList.map(mappingUser => {
      const mappedPresenceObject: Record<string, any> = {};
      if (Array.isArray(mappingUser.presences)) {
        mappingUser.presences.forEach((presenceEntity: any) => { mappedPresenceObject[presenceEntity.date] = presenceEntity; });
      }
      return { ...mappingUser, presenceMap: mappedPresenceObject };
    });
  }, [extractedSelfRecord, isolatedPaginationSlice]);

  const headerCounts = useMemo(() => {
    const counts: Record<string, { count: number, category: any }[]> = {};
    const allFilteredUsers = extractedSelfRecord ? [extractedSelfRecord, ...sortedPeerCollection] : sortedPeerCollection;

    const datesToProcess = new Set([
      ...localizedWeekCollection.map(d => d.format('YYYY-MM-DD')),
      activeMobileViewDate
    ]);

    datesToProcess.forEach(dateStr => {
      const dayObj = dayjs(dateStr);
      const isWeekend = dayObj.isoWeekday() >= 6;
      const dayCounts = new Map<number, { count: number, category: any }>();
      const isHoliday = holidays.some(h => h.date === dateStr);

      allFilteredUsers.forEach(u => {
        const isWeekendDisabled = isWeekend && !u.can_work_weekends;
        let cat = null;
        if (!isHoliday) {
           if (u.presences) {
             const p = u.presences.find((pr: any) => pr.date === dateStr);
             if (p && p.categories) cat = p.categories;
           }
           if (!cat && !isWeekendDisabled && u.default_category) {
             cat = u.default_category;
           }
        }

        if (cat) {
          const existing = dayCounts.get(cat.id_category);
          if (existing) {
            existing.count++;
          } else {
            dayCounts.set(cat.id_category, { count: 1, category: cat });
          }
        }
      });
      counts[dateStr] = Array.from(dayCounts.values()).sort((a,b) => b.count - a.count);
    });
    return counts;
  }, [extractedSelfRecord, sortedPeerCollection, localizedWeekCollection, activeMobileViewDate, holidays]);

  const mapStatusToTranslation = (status?: string) => {
    switch (status) {
      case 'Occupato': return t('profile.status_occupato', 'Busy');
      case 'Smart Working': return t('profile.status_smart_working', 'Smart Working');
      case 'In Ferie': return t('profile.status_in_ferie', 'On Leave');
      case 'Disponibile': default: return t('profile.status_disponibile', 'Available');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-10">
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
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
                {categories.map(c => <button type="button" key={c.id_category} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${selectedCategoryFilter === String(c.id_category) ? 'bg-secondary text-secondary-content' : 'hover:bg-base-200 text-base-content'}`} onClick={() => { setSelectedCategoryFilter(String(c.id_category)); setActiveDropdownContext(null); }}><span className="text-xl flex items-center justify-center opacity-80">{getCategoryIcon(c)}</span><span className="truncate">{getDynamicCategoryName(c, i18n.language, t)}</span></button>)}
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
            <button onClick={() => setReferenceDateObject(c => c.subtract(1, 'week'))} className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 text-base-content opacity-70"><KeyboardArrowLeftIcon fontSize="small" /></button>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content text-center flex-1 whitespace-nowrap px-1">{initialWeeklyBound.locale(i18n.language).format('DD MMM')} - {terminalWeeklyBound.locale(i18n.language).format('DD MMM YYYY')}</h3>
            <button onClick={() => setReferenceDateObject(c => c.add(1, 'week'))} className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 text-base-content opacity-70"><KeyboardArrowRightIcon fontSize="small" /></button>
          </div>
        </div>
      </div>

      <div className="lg:hidden space-y-3 pt-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 ml-4 flex items-center gap-1"><DateRangeIcon sx={{ fontSize: 12 }} /> {t('calendar.select_day', 'Select Day')}</label>
        <div className="flex overflow-x-auto hide-scrollbar gap-2 bg-base-100/90 p-3 rounded-[2rem] border border-base-300 shadow-lg sticky top-[4.5rem] z-30 scroll-smooth snap-x snap-mandatory backdrop-blur-sm" ref={scrollableMobileContainerRef}>
          {extendedMobileDateCollection.map(dayItem => {
            const compiledDateIdentifier = dayItem.format('YYYY-MM-DD');
            const evaluatesToCurrentDay = dayItem.isSame(dayjs(), 'day');
            const representsSelection = compiledDateIdentifier === activeMobileViewDate;
            const identifiesWeekendBoundary = dayItem.isoWeekday() >= 6;
            const isHoliday = holidays.some(h => h.date === compiledDateIdentifier);

            return (
              <button
                key={compiledDateIdentifier}
                data-date={compiledDateIdentifier}
                onClick={() => { setActiveMobileViewDate(compiledDateIdentifier); setActiveDateFilter(compiledDateIdentifier); executeScrollToTargetDate(compiledDateIdentifier); }}
                className={`flex flex-col items-center justify-center snap-center transition-all duration-200 min-w-[4rem] rounded-2xl border-2 ${
                  representsSelection
                    ? 'bg-primary text-primary-content border-primary shadow-lg shadow-primary/25 scale-105'
                    : evaluatesToCurrentDay
                    ? 'bg-primary/10 text-primary border-primary/40 cursor-pointer'
                    : isHoliday
                    ? 'bg-error/10 text-error border-error/20 cursor-pointer'
                    : identifiesWeekendBoundary
                    ? 'bg-base-200/50 text-base-content/40 border-base-200 cursor-default'
                    : 'bg-transparent text-base-content border-base-200 hover:bg-base-200 hover:border-base-300 cursor-pointer'
                } py-3 px-2`}
              >
                <span className="text-[9px] uppercase font-black tracking-widest opacity-70 mb-1">{dayItem.locale(i18n.language).format('ddd')}</span>
                <span className={`text-xl font-black tracking-tighter ${representsSelection ? '' : evaluatesToCurrentDay ? 'text-primary' : ''}`}>{dayItem.format('D')}</span>
                {isHoliday && !representsSelection && <span className="w-1 h-1 rounded-full bg-error mt-1"></span>}
              </button>
            );
          })}
          <div className="min-w-[1rem] snap-center"></div>
        </div>

        {!holidays.some(h => h.date === activeMobileViewDate) && headerCounts[activeMobileViewDate]?.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 bg-base-200/30 py-3 px-4 rounded-[1.25rem] border border-base-300">
            {headerCounts[activeMobileViewDate].map(item => (
              <div key={item.category.id_category}
                className="flex items-center gap-1.5 bg-base-100 border border-base-300 rounded-xl px-3 py-1.5 shadow-xs"
                title={getDynamicCategoryName(item.category, i18n.language, t)}
              >
                <span className={`text-base flex items-center justify-center ${getCategoryColorClass(item.category)}`}>{getCategoryIcon(item.category)}</span>
                <span className="text-xs font-black text-base-content/70">{item.count}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pb-4 mt-4 relative z-10">
          {formattedUserDataset.length === 0 ? (
            <div className="bg-base-100 p-10 rounded-3xl border border-base-300 text-center text-base-content opacity-50 font-bold shadow-inner">{t('admin.alert_warning', 'No records found')}</div>
          ) : (
            formattedUserDataset.map((profileEntity) => {
              const mapsToAuthenticatedUser = currentUser?.id_user === profileEntity.id_user;
              const grantsModificationRights = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'superadmin' || currentUser?.role === 'ADMIN' || mapsToAuthenticatedUser;
              const localizedPresenceObject = profileEntity.presenceMap[activeMobileViewDate];
              const isWeekendDisabled = dayjs(activeMobileViewDate).isoWeekday() >= 6 && !profileEntity.can_work_weekends;
              const targetHoliday = holidays.find(h => h.date === activeMobileViewDate);

              const validatesActivePresence = localizedPresenceObject && localizedPresenceObject.categories;
              const computedCategoryPayload = validatesActivePresence ? localizedPresenceObject.categories : (isWeekendDisabled || targetHoliday ? null : profileEntity.default_category);
              const confirmsGhostEntityRender = !validatesActivePresence && !isWeekendDisabled && !targetHoliday && profileEntity.default_category;

              return (
                <div key={profileEntity.id_user} className={`bg-base-100 rounded-3xl p-4 border flex items-center gap-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/40 ${mapsToAuthenticatedUser ? 'border-primary outline outline-2 outline-primary/40 outline-offset-1 bg-gradient-to-r from-primary/[0.02] to-transparent' : 'border-base-300'}`}>
                  <div className="avatar shrink-0 relative cursor-pointer hover:opacity-80 transition-opacity" onClick={() => triggerNavigation(`/profile/${profileEntity.id_user}`)}>
                    <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden shadow-sm ${mapsToAuthenticatedUser ? 'border-primary' : 'border-base-300'}`}>
                      <img src={profileEntity.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileEntity.alias || profileEntity.full_name || 'U')}&background=random`} alt={profileEntity.alias} className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-base-100 rounded-full border border-base-200 shadow-sm p-[2px] z-10 flex items-center justify-center scale-105" title={mapStatusToTranslation(profileEntity.status)}>
                      {resolveStatusIndicatorIcon(profileEntity.status)}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden cursor-pointer group/card" onClick={() => triggerNavigation(`/profile/${profileEntity.id_user}`)}>
                    <div className="font-black text-base-content text-lg truncate uppercase tracking-tight flex items-center gap-2 group-hover/card:text-primary transition-colors">
                      {profileEntity.alias}
                      <ArrowForwardIosIcon sx={{ fontSize: 10 }} className="text-base-content opacity-30 group-hover/card:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-[10px] text-base-content opacity-70 font-bold uppercase tracking-widest truncate mt-0.5">
                      {profileEntity.work || t('profile.team_member', 'Team Member')}
                    </div>
                    {profileEntity.department && (
                      <div className="text-[9px] text-primary-content font-black uppercase tracking-wider bg-primary px-2 py-0.5 rounded-md mt-1.5 inline-flex items-center gap-1 shadow-xs">
                        <BusinessIcon sx={{ fontSize: 10 }} /> {profileEntity.department}
                      </div>
                    )}
                  </div>
                  <div 
                    onClick={() => {
                      if (targetHoliday) {
                        setOverlayContextProperties({
                          date: dayjs(activeMobileViewDate).locale(i18n.language).format('DD MMM YYYY'),
                          catName: targetHoliday.name_holiday,
                          categoryData: null,
                          userName: profileEntity.alias || profileEntity.full_name,
                          isHoliday: true
                        });
                        return;
                      }
                      if (grantsModificationRights && !isWeekendDisabled) {
                        onAddPresence(profileEntity.id_user, activeMobileViewDate);
                      } else if (!grantsModificationRights && computedCategoryPayload) {
                        setOverlayContextProperties({
                          date: dayjs(activeMobileViewDate).locale(i18n.language).format('DD MMM YYYY'),
                          catName: getDynamicCategoryName(computedCategoryPayload, i18n.language, t),
                          categoryData: computedCategoryPayload,
                          userName: profileEntity.alias || profileEntity.full_name,
                          isDefault: !!confirmsGhostEntityRender
                        });
                      }
                    }}
                    className={`shrink-0 w-20 h-20 flex items-center justify-center rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${targetHoliday || (grantsModificationRights && !isWeekendDisabled) || (!grantsModificationRights && computedCategoryPayload) ? 'cursor-pointer' : ''} ${(localizedPresenceObject || (!isWeekendDisabled && profileEntity.default_category) || targetHoliday) ? 'bg-base-200/80 border-base-300 shadow-xs' : 'border-dashed border-base-300 bg-base-200/40 hover:bg-base-200'}`}
                  >
                    <DayCell presence={localizedPresenceObject} defaultCategory={profileEntity.default_category} grantsEditPermissions={grantsModificationRights} onAddPresence={onAddPresence} userId={profileEntity.id_user} targetDate={activeMobileViewDate} canWorkWeekends={profileEntity.can_work_weekends} holidayName={targetHoliday?.name_holiday} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="hidden lg:block rounded-[2.5rem] border-2 border-base-300 shadow-2xl overflow-hidden relative z-10" style={{background: 'var(--fallback-b1,oklch(var(--b1)))'}}>
        <div className="overflow-x-auto w-full hide-scrollbar">
          <table className="table table-fixed w-full min-w-[1000px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="p-0 border-r-2 border-base-300 w-[320px] sticky left-0 top-0 z-[60] shadow-[4px_0_16px_-4px_rgba(0,0,0,0.18)]" style={{background: 'var(--fallback-b1,oklch(var(--b1)))'}}>
                  <div className="flex flex-col h-full divide-y-2 divide-base-300">
                    <div onClick={() => triggerSortingExecution('alias')} className="p-5 cursor-pointer hover:bg-base-200/60 transition-colors flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/70 block mb-1">{t('calendar.employee', 'Employee')}</span>
                        <div className={`text-base font-black tracking-tight ${sortingConfiguration.metric === 'alias' ? 'text-primary' : 'text-base-content'}`}>{t('calendar.personal_data', 'Personal Data')}</div>
                      </div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${sortingConfiguration.metric === 'alias' ? 'bg-primary/10 text-primary opacity-100' : 'opacity-0'}`}>
                        <ArrowUpwardIcon sx={{ fontSize: 14, transform: sortingConfiguration.orderingDirection === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x-2 divide-base-300">
                      <div onClick={() => triggerSortingExecution('work')} className="px-4 py-3 cursor-pointer hover:bg-base-200/60 transition-colors flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-widest truncate ${sortingConfiguration.metric === 'work' ? 'text-primary' : 'text-base-content/50'}`}>{t('admin.role', 'Role')}</span>
                        {sortingConfiguration.metric === 'work' && <ArrowUpwardIcon sx={{ fontSize: 11 }} className="text-primary shrink-0" />}
                      </div>
                      <div onClick={() => triggerSortingExecution('department')} className="px-4 py-3 cursor-pointer hover:bg-base-200/60 transition-colors flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-widest truncate ${sortingConfiguration.metric === 'department' ? 'text-primary' : 'text-base-content/50'}`}>{t('admin.department', 'Dept')}</span>
                        {sortingConfiguration.metric === 'department' && <ArrowUpwardIcon sx={{ fontSize: 11 }} className="text-primary shrink-0" />}
                      </div>
                    </div>
                  </div>
                </th>
                {localizedWeekCollection.map(mappedDayNode => {
                  const serializedDateReference = mappedDayNode.format('YYYY-MM-DD');
                  const evaluatesToCurrentDay = mappedDayNode.isSame(dayjs(), 'day');
                  const matchesFilterCriteria = serializedDateReference === activeDateFilter;
                  const indicatesWeekendEntity = mappedDayNode.isoWeekday() >= 6;
                  const indicatesSaturdayEntity = mappedDayNode.isoWeekday() === 6;
                  const targetHoliday = holidays.find(h => h.date === serializedDateReference);

                  const activeCategories = headerCounts[serializedDateReference] || [];

                  let appliedHeaderCSSConfiguration = 'bg-base-100 text-base-content';
                  if (targetHoliday) appliedHeaderCSSConfiguration = 'bg-error/10 text-error';
                  else if (indicatesWeekendEntity) appliedHeaderCSSConfiguration = 'bg-base-200 text-base-content opacity-60';

                  let contextualBorderHighlight = 'border-b-4 border-base-300';
                  if (matchesFilterCriteria) {
                    appliedHeaderCSSConfiguration = targetHoliday ? 'bg-error/20 text-error' : 'bg-base-200 text-primary';
                    contextualBorderHighlight = targetHoliday ? 'border-b-4 border-error shadow-inner' : 'border-b-4 border-primary shadow-inner';
                  } else if (evaluatesToCurrentDay) {
                    appliedHeaderCSSConfiguration = targetHoliday ? 'bg-error/10 text-error' : 'bg-base-100 text-primary';
                    contextualBorderHighlight = targetHoliday ? 'border-b-4 border-error' : 'border-b-4 border-primary';
                  }

                  const saturdaySeparatorClass = indicatesSaturdayEntity ? '!border-r-2 !border-r-base-300/80 shadow-[1px_0_2px_rgba(0,0,0,0.02)] relative z-[5]' : '';

                  return (
                    <th
                      key={serializedDateReference}
                      onClick={() => setActiveDateFilter(serializedDateReference)}
                      className={`p-0 align-top border-r-2 ${contextualBorderHighlight} cursor-pointer select-none transition-all duration-150 ${appliedHeaderCSSConfiguration} ${saturdaySeparatorClass} hover:brightness-95 group/th`}
                    >
                      <div className="flex flex-col h-full justify-between items-center py-4 px-1 relative">
                        <div className="text-center w-full">
                          <div className="text-[10px] uppercase font-black tracking-[0.2em] mb-2 opacity-60">{mappedDayNode.locale(i18n.language).format('ddd')}</div>
                          <div className={`relative inline-flex items-center justify-center transition-all duration-300 ${
                            evaluatesToCurrentDay && !matchesFilterCriteria
                              ? 'w-9 h-9 rounded-full bg-primary/10 ring-2 ring-primary/30 text-primary'
                              : matchesFilterCriteria
                              ? 'w-9 h-9 rounded-full bg-primary text-primary-content shadow-md shadow-primary/30 scale-110'
                              : 'w-9 h-9 rounded-full group-hover/th:bg-base-300'
                          } text-2xl font-black tracking-tighter`}>
                            {mappedDayNode.locale(i18n.language).format('DD')}
                          </div>
                        </div>
                        {!targetHoliday && activeCategories.length > 0 && (
                          <div className="mt-3 w-full flex flex-wrap justify-center gap-1 px-1">
                            {activeCategories.map(item => (
                              <span
                                key={item.category.id_category}
                                className="flex items-center gap-0.5 bg-base-200/80 border border-base-300/60 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-base-content/60"
                                title={getDynamicCategoryName(item.category, i18n.language, t)}
                              >
                                <span className={`text-[11px] ${getCategoryColorClass(item.category)}`}>{getCategoryIcon(item.category)}</span>
                                <span>{item.count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {targetHoliday && (
                          <div className="mt-3 w-full px-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-error/80 text-center truncate w-full block bg-error/10 rounded-lg px-2 py-1" title={targetHoliday.name_holiday}>{targetHoliday.name_holiday}</span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-base-300 relative z-10 bg-base-100">
              {formattedUserDataset.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-base-content opacity-50 font-bold text-lg bg-base-100">{t('admin.alert_warning', 'No records found')}</td></tr>
              ) : (
                formattedUserDataset.map((profileEntity, iterationIndex) => {
                  const mapsToAuthenticatedUser = currentUser?.id_user === profileEntity.id_user;
                  const grantsModificationRights = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'superadmin' || currentUser?.role === 'ADMIN' || mapsToAuthenticatedUser;
                  const sequentialRowColorTheme = iterationIndex % 2 !== 0 ? 'bg-base-200/40' : 'bg-base-100';

                  return (
                    <tr key={profileEntity.id_user} className={`group/row transition-colors duration-100 ${mapsToAuthenticatedUser ? 'outline outline-2 outline-primary/50 outline-offset-[-2px] relative z-20' : 'hover:bg-base-200/60'} ${sequentialRowColorTheme}`}>
                      <td className={`relative p-0 border-r-2 border-base-300 sticky left-0 z-50 overflow-hidden shadow-[6px_0_20px_-6px_rgba(0,0,0,0.12)] ${sequentialRowColorTheme}`}>
                        <div className="relative z-10 flex flex-col h-full divide-y-2 divide-base-300/60">
                          <div className="p-4 pl-5 flex items-center gap-3 cursor-pointer hover:bg-primary/[0.03] transition-colors relative group/name" onClick={() => triggerNavigation(`/profile/${profileEntity.id_user}`)}>
                            <div className="absolute left-0 top-0 bottom-0 w-1 z-20 overflow-hidden rounded-r-full">
                              <div className={`w-full bg-primary transition-all duration-500 ease-out ${mapsToAuthenticatedUser ? 'h-full' : 'h-0 group-hover/row:h-full'}`}></div>
                            </div>
                            <div className={`avatar shrink-0 relative transition-all duration-300 group-hover/row:scale-105 ${mapsToAuthenticatedUser ? 'ring-2 ring-primary ring-offset-2 rounded-2xl' : ''}`}>
                              <div className="w-12 h-12 rounded-2xl border-2 border-base-300 shadow-sm overflow-hidden">
                                <img src={profileEntity.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profileEntity.alias || profileEntity.full_name || 'U')}&background=random`} alt={profileEntity.alias} className="object-cover w-full h-full" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 bg-base-100 rounded-full border border-base-200 shadow-sm p-[2px] z-10 flex items-center justify-center" title={mapStatusToTranslation(profileEntity.status)}>
                                {resolveStatusIndicatorIcon(profileEntity.status)}
                              </div>
                            </div>
                            <div className="overflow-hidden z-20 flex-1">
                              <div className="font-black text-base-content text-base truncate group-hover/name:text-primary transition-colors uppercase tracking-tight flex items-center gap-1.5">
                                {profileEntity.alias}
                                {mapsToAuthenticatedUser && <span className="text-[8px] text-primary-content font-black uppercase tracking-widest bg-primary px-1.5 py-0.5 rounded-md shadow-sm">{t('profile.you', 'You')}</span>}
                              </div>
                              <div className="text-[10px] text-base-content/50 font-medium truncate mt-0.5">{profileEntity.full_name}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 divide-x-2 divide-base-300/60 text-[9px] font-black uppercase tracking-widest text-base-content/40">
                            <div className="px-4 py-2.5 truncate" title={profileEntity.work}>{profileEntity.work || t('profile.team_member', 'Team Member')}</div>
                            <div className="px-4 py-2.5 truncate text-primary/70 flex items-center gap-1" title={profileEntity.department}><BusinessIcon sx={{ fontSize: 11 }} /> {profileEntity.department}</div>
                          </div>
                        </div>
                      </td>
                      {localizedWeekCollection.map(mappedDayNode => {
                        const serializedDateReference = mappedDayNode.format('YYYY-MM-DD');
                        const localizedPresenceObject = profileEntity.presenceMap[serializedDateReference];
                        const indicatesSaturdayEntity = mappedDayNode.isoWeekday() === 6;
                        const matchesFilterCriteria = serializedDateReference === activeDateFilter;
                        const targetHoliday = holidays.find(h => h.date === serializedDateReference);

                        const isWeekendDisabled = mappedDayNode.isoWeekday() >= 6 && !profileEntity.can_work_weekends;

                        let responsiveCellBackground = 'bg-transparent';
                        if (matchesFilterCriteria) responsiveCellBackground = 'bg-base-200 shadow-inner';
                        else if (isWeekendDisabled || targetHoliday) responsiveCellBackground = 'bg-base-300/50';

                        const saturdaySeparatorClass = indicatesSaturdayEntity ? '!border-r-2 !border-r-base-300/80 shadow-[1px_0_2px_rgba(0,0,0,0.02)] relative z-[5]' : '';
                        
                        const validatesActivePresence = localizedPresenceObject && localizedPresenceObject.categories;
                        const computedCategoryPayload = validatesActivePresence ? localizedPresenceObject.categories : (isWeekendDisabled || targetHoliday ? null : profileEntity.default_category);
                        const confirmsGhostEntityRender = !validatesActivePresence && !isWeekendDisabled && !targetHoliday && profileEntity.default_category;

                        return (
                          <td key={serializedDateReference} className={`p-0 border-r border-base-300/50 relative transition-colors duration-150 ${isWeekendDisabled || targetHoliday ? '' : 'hover:bg-primary/[0.025]'} ${responsiveCellBackground} ${saturdaySeparatorClass}`}>
                            <div 
                              onClick={() => {
                                if (targetHoliday) {
                                  setOverlayContextProperties({
                                    date: mappedDayNode.locale(i18n.language).format('DD MMM YYYY'),
                                    catName: targetHoliday.name_holiday,
                                    categoryData: null,
                                    userName: profileEntity.alias || profileEntity.full_name,
                                    isHoliday: true
                                  });
                                  return;
                                }
                                if (!grantsModificationRights && computedCategoryPayload && !isWeekendDisabled) {
                                  setOverlayContextProperties({
                                    date: mappedDayNode.locale(i18n.language).format('DD MMM YYYY'),
                                    catName: getDynamicCategoryName(computedCategoryPayload, i18n.language, t),
                                    categoryData: computedCategoryPayload,
                                    userName: profileEntity.alias || profileEntity.full_name,
                                    isDefault: !!confirmsGhostEntityRender
                                  });
                                } else if (grantsModificationRights && !isWeekendDisabled) {
                                  onAddPresence(profileEntity.id_user, serializedDateReference);
                                }
                              }}
                              className={`w-full h-full min-h-[125px] flex items-center justify-center ${(grantsModificationRights && !isWeekendDisabled && !targetHoliday) || (!grantsModificationRights && computedCategoryPayload && !isWeekendDisabled && !targetHoliday) || targetHoliday ? 'cursor-pointer' : ''}`}
                            >
                              <DayCell presence={localizedPresenceObject} defaultCategory={profileEntity.default_category} grantsEditPermissions={grantsModificationRights} onAddPresence={onAddPresence} userId={profileEntity.id_user} targetDate={serializedDateReference} canWorkWeekends={profileEntity.can_work_weekends} holidayName={targetHoliday?.name_holiday} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {calculatedTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 relative z-10">
          <button className="btn btn-sm btn-ghost" onClick={() => setPaginationIndex(p => Math.max(1, p - 1))} disabled={paginationIndex === 1}><KeyboardArrowLeftIcon fontSize="small" /></button>
          <div className="join border border-base-300 rounded-xl overflow-hidden shadow-sm">
            {Array.from({ length: calculatedTotalPages }, (_, indexReference) => indexReference + 1).map(iteratingPage => {
              if (iteratingPage === 1 || iteratingPage === calculatedTotalPages || (iteratingPage >= paginationIndex - 1 && iteratingPage <= paginationIndex + 1)) {
                return (<button key={iteratingPage} onClick={() => setPaginationIndex(iteratingPage)} className={`join-item btn btn-sm border-none w-10 ${paginationIndex === iteratingPage ? 'bg-primary text-primary-content font-black' : 'bg-base-100 hover:bg-base-200'}`}>{iteratingPage}</button>);
              } else if (iteratingPage === paginationIndex - 2 || iteratingPage === paginationIndex + 2) {
                return <button key={iteratingPage} className="join-item btn btn-sm border-none bg-base-100 cursor-default px-2">...</button>;
              }
              return null;
            })}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => setPaginationIndex(p => Math.min(calculatedTotalPages, p + 1))} disabled={paginationIndex === calculatedTotalPages}><KeyboardArrowRightIcon fontSize="small" /></button>
        </div>
      )}

      {overlayContextProperties && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/70 backdrop-blur-md transition-opacity animate-fade-in" onClick={() => setOverlayContextProperties(null)}></div>
          <div className="bg-base-100/95 backdrop-blur-sm border border-base-300 shadow-2xl rounded-[2rem] p-8 text-center relative z-10 w-full max-w-sm animate-fade-in-up">
            <button onClick={() => setOverlayContextProperties(null)} className="btn btn-sm btn-ghost btn-circle absolute right-4 top-4 text-base-content/40 hover:text-base-content hover:bg-base-200">✕</button>
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-5 shadow-lg ${
              overlayContextProperties.isHoliday
                ? 'bg-error/10 border-2 border-error/30 text-error'
                : 'bg-primary/10 border-2 border-primary/20 text-primary'
            }`}>
              {overlayContextProperties.isHoliday ? (
                <CelebrationIcon sx={{ fontSize: 44 }} className="text-error" />
              ) : (
                getCategoryIcon(overlayContextProperties.categoryData)
              )}
            </div>
            <h3 className="text-2xl font-black tracking-tight text-base-content mb-1">{overlayContextProperties.catName}</h3>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-black">
                {overlayContextProperties.userName}
              </span>
              <span className="text-base-content/30 text-xs">·</span>
              <span className="text-xs font-bold text-base-content/50 bg-base-200 border border-base-300 px-3 py-1.5 rounded-xl">{overlayContextProperties.date}</span>
            </div>
            {overlayContextProperties.isDefault && (
              <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-base-content/30 bg-base-200 border border-base-300 rounded-lg px-3 py-1">
                {t('profile.optional', 'Default Location')}
              </div>
            )}
            <div className="w-full mt-7">
              <button onClick={() => setOverlayContextProperties(null)} className="btn btn-primary w-full rounded-2xl font-black text-sm h-12 min-h-0 uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                {t('admin.btn_accept', 'Accept')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};