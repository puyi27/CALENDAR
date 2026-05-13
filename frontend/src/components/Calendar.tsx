import React, { useState, useMemo, useEffect, useRef } from 'react';
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

  // All filtered users with their presenceMaps pre-built (for monthly desktop grid)
  const allUsersWithPresenceMap = useMemo(() => {
    const all = extractedSelfRecord ? [extractedSelfRecord, ...sortedPeerCollection] : sortedPeerCollection;
    return all.map(u => {
      const pm: Record<string, any> = {};
      if (Array.isArray(u.presences)) u.presences.forEach((p: any) => { pm[p.date] = p; });
      return { ...u, presenceMap: pm };
    });
  }, [extractedSelfRecord, sortedPeerCollection]);

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-10">
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-base-100 p-4 md:p-5 rounded-[2rem] border border-base-300 shadow-lg relative z-[90] border-t-4 border-t-primary/30">
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
            <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 flex items-center gap-1">
              <DateRangeIcon sx={{ fontSize: 12 }} />
              <span className="hidden lg:inline">{t('calendar.visible_month', 'Mes')}</span>
              <span className="lg:hidden">{t('calendar.visible_week', 'Semana')}</span>
            </label>
            <button onClick={triggerResetToPresentDate} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"><TodayIcon sx={{ fontSize: 12 }} /> {t('calendar.today', 'Today')}</button>
          </div>
          <div className="flex items-center justify-between gap-2 bg-base-200 px-2 rounded-[1.25rem] border border-base-300 h-12 w-full shadow-inner">
            <button onClick={() => setReferenceDateObject(c => c.subtract(1, window.innerWidth >= 1024 ? 'month' : 'week'))} className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 text-base-content opacity-70"><KeyboardArrowLeftIcon fontSize="small" /></button>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content text-center flex-1 whitespace-nowrap px-1">
              <span className="hidden lg:inline">{referenceDateObject.locale(i18n.language).format('MMMM YYYY')}</span>
              <span className="lg:hidden">{initialWeeklyBound.locale(i18n.language).format('DD MMM')} – {terminalWeeklyBound.locale(i18n.language).format('DD MMM')}</span>
            </h3>
            <button onClick={() => setReferenceDateObject(c => c.add(1, window.innerWidth >= 1024 ? 'month' : 'week'))} className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 text-base-content opacity-70"><KeyboardArrowRightIcon fontSize="small" /></button>
          </div>
        </div>
      </div>

      <div className="lg:hidden space-y-3 pt-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-base-content opacity-50 ml-4 flex items-center gap-1"><DateRangeIcon sx={{ fontSize: 12 }} /> {t('calendar.select_day', 'Select Day')}</label>
        <div className="flex overflow-x-auto hide-scrollbar gap-2 bg-base-100 p-3 rounded-[1.5rem] border border-base-300 shadow-sm sticky top-[4.5rem] z-30 scroll-smooth snap-x snap-mandatory" ref={scrollableMobileContainerRef}>
          {extendedMobileDateCollection.map(dayItem => {
            const compiledDateIdentifier = dayItem.format('YYYY-MM-DD');
            const evaluatesToCurrentDay = dayItem.isSame(dayjs(), 'day');
            const representsSelection = compiledDateIdentifier === activeMobileViewDate;
            const identifiesWeekendBoundary = dayItem.isoWeekday() >= 6;
            const isHoliday = holidays.some(h => h.date === compiledDateIdentifier);

            let assignedMobileClassSelector = 'bg-base-100 border-base-300';
            if (representsSelection) assignedMobileClassSelector = 'bg-primary text-primary-content border-primary shadow-md scale-105';
            else if (evaluatesToCurrentDay) assignedMobileClassSelector = 'bg-base-200 text-primary border-primary cursor-pointer';
            else if (isHoliday) assignedMobileClassSelector = 'bg-error/10 text-error border-error/20 opacity-90 cursor-pointer';
            else if (identifiesWeekendBoundary) assignedMobileClassSelector = 'bg-base-300 text-base-content border-base-300 opacity-70 cursor-default';
            else assignedMobileClassSelector = 'bg-base-100 hover:bg-base-200 border-base-300 cursor-pointer';

            return (
              <button key={compiledDateIdentifier} data-date={compiledDateIdentifier} onClick={() => { setActiveMobileViewDate(compiledDateIdentifier); setActiveDateFilter(compiledDateIdentifier); executeScrollToTargetDate(compiledDateIdentifier); }} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-transform min-w-[4.5rem] snap-center border ${assignedMobileClassSelector}`}>
                <span className="text-[10px] uppercase font-black tracking-widest opacity-70">{dayItem.locale(i18n.language).format('ddd')}</span>
                <span className="text-xl font-black tracking-tighter mt-1">{dayItem.format('D')}</span>
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

      {/* ── DESKTOP: Monthly calendar grid ── */}
      <div className="hidden lg:block animate-fade-in">
        {/* Month title bar */}
        <div className="flex items-end justify-between mb-5 px-1">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-base-content capitalize">
              {referenceDateObject.locale(i18n.language).format('MMMM')}
              <span className="text-base-content/30 ml-3 font-light text-3xl">{referenceDateObject.format('YYYY')}</span>
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-base-content/40 mt-1">
              {allUsersWithPresenceMap.length} {t('calendar.members', 'miembros')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setReferenceDateObject(c => c.subtract(1, 'month'))} className="btn btn-sm btn-circle btn-ghost border border-base-300 hover:bg-base-200">
              <KeyboardArrowLeftIcon fontSize="small" />
            </button>
            <button onClick={triggerResetToPresentDate} className="btn btn-sm rounded-xl font-black uppercase tracking-widest px-5 border border-base-300 hover:bg-primary hover:text-primary-content hover:border-primary transition-all">
              {t('calendar.today', 'Hoy')}
            </button>
            <button onClick={() => setReferenceDateObject(c => c.add(1, 'month'))} className="btn btn-sm btn-circle btn-ghost border border-base-300 hover:bg-base-200">
              <KeyboardArrowRightIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-[2.5rem] border-2 border-base-300 overflow-hidden shadow-xl bg-base-100">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b-2 border-base-300" style={{background: 'linear-gradient(180deg, var(--fallback-b2,oklch(var(--b2))) 0%, var(--fallback-b1,oklch(var(--b1))) 100%)'}}>
            {Array.from({ length: 7 }, (_, i) => {
              const dayLabel = dayjs().startOf('isoWeek').add(i, 'day').locale(i18n.language).format('ddd');
              const isWeekendCol = i >= 5;
              return (
                <div key={i} className={`py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] ${isWeekendCol ? 'text-base-content/30' : 'text-base-content/50'}`}>{dayLabel}</div>
              );
            })}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Leading blanks */}
            {Array.from({ length: referenceDateObject.startOf('month').isoWeekday() - 1 }, (_, i) => (
              <div key={`blank-${i}`} className={`min-h-[150px] border-b border-r border-base-300/50 bg-base-200/20 ${i === referenceDateObject.startOf('month').isoWeekday() - 2 ? 'border-r-2 border-r-base-300' : ''}`} />
            ))}

            {/* Month days */}
            {Array.from({ length: referenceDateObject.daysInMonth() }, (_, idx) => {
              const dayObj = referenceDateObject.startOf('month').add(idx, 'day');
              const dateStr = dayObj.format('YYYY-MM-DD');
              const isToday = dayObj.isSame(dayjs(), 'day');
              const isSelected = dateStr === activeDateFilter;
              const isWeekend = dayObj.isoWeekday() >= 6;
              const isSaturday = dayObj.isoWeekday() === 6;
              const targetHoliday = holidays.find(h => h.date === dateStr);

              // Users with activity on this day
              const MAX_VISIBLE = 4;
              const dayUsers = allUsersWithPresenceMap.map(u => {
                const wkDisabled = isWeekend && !u.can_work_weekends;
                if (wkDisabled) return null;
                const presence = u.presenceMap[dateStr];
                const category = presence?.categories || (targetHoliday ? null : u.default_category);
                if (!category) return null;
                const isGhost = !presence?.categories && !!u.default_category;
                return { u, category, isGhost };
              }).filter(Boolean) as { u: any; category: any; isGhost: boolean }[];

              const visible = dayUsers.slice(0, MAX_VISIBLE);
              const overflow = dayUsers.length - MAX_VISIBLE;

              return (
                <div
                  key={dateStr}
                  onClick={() => { setActiveDateFilter(dateStr); setActiveMobileViewDate(dateStr); }}
                  className={`min-h-[150px] border-b border-r border-base-300/50 p-2.5 flex flex-col gap-1 cursor-pointer transition-all duration-150 group/cell relative
                    ${isSaturday ? 'border-r-2 border-r-base-300' : ''}
                    ${isWeekend ? 'bg-base-200/25' : 'bg-base-100'}
                    ${targetHoliday ? '!bg-error/5' : ''}
                    ${isSelected ? '!bg-primary/5 ring-2 ring-inset ring-primary/40' : 'hover:bg-base-200/50'}
                  `}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-full transition-all select-none
                      ${isToday ? 'bg-primary text-primary-content shadow-md' : ''}
                      ${isSelected && !isToday ? 'ring-2 ring-primary text-primary' : ''}
                      ${!isToday && !isSelected ? (isWeekend ? 'text-base-content/30' : 'text-base-content/60 group-hover/cell:text-base-content') : ''}
                    `}>{dayObj.format('D')}</span>
                    {targetHoliday && (
                      <span className="text-[8px] font-black uppercase text-error bg-error/10 rounded-full px-2 py-0.5 truncate max-w-[55%]" title={targetHoliday.name_holiday}>
                        {targetHoliday.name_holiday}
                      </span>
                    )}
                  </div>

                  {/* User presence entries */}
                  <div className="flex flex-col gap-0.5">
                    {targetHoliday ? (
                      <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-error/10">
                        <CelebrationIcon sx={{ fontSize: 13 }} className="text-error shrink-0" />
                        <span className="text-[10px] font-black text-error truncate">{targetHoliday.name_holiday}</span>
                      </div>
                    ) : (
                      visible.map(({ u, category, isGhost }) => {
                        const grantsEdit = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'superadmin' || currentUser?.id_user === u.id_user;
                        return (
                          <div
                            key={u.id_user}
                            onClick={e => {
                              e.stopPropagation();
                              if (grantsEdit) {
                                onAddPresence(u.id_user, dateStr);
                              } else {
                                setOverlayContextProperties({ date: dayObj.locale(i18n.language).format('DD MMM YYYY'), catName: getDynamicCategoryName(category, i18n.language, t), categoryData: category, userName: u.alias || u.full_name, isDefault: isGhost });
                              }
                            }}
                            className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg transition-colors group/entry hover:bg-base-200 ${isGhost ? 'opacity-50' : ''} ${u.id_user === currentUser?.id_user ? 'bg-primary/8 ring-1 ring-primary/20' : ''}`}
                          >
                            <img
                              src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.alias || 'U')}&background=random&size=32`}
                              className="w-5 h-5 rounded-full shrink-0 border border-base-300/60"
                              alt={u.alias}
                            />
                            <span className={`text-sm leading-none shrink-0 ${getCategoryColorClass(category)}`}>{getCategoryIcon(category)}</span>
                            <span className="text-[10px] font-bold truncate text-base-content/70 group-hover/entry:text-base-content">{u.alias}</span>
                          </div>
                        );
                      })
                    )}
                    {overflow > 0 && (
                      <div className="text-[10px] font-black text-base-content/40 px-2 mt-0.5">+{overflow} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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