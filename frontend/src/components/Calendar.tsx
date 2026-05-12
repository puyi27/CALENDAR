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

import { getDynamicCategoryName, getCategoryIcon } from '../utils/categoryUtils';

dayjs.extend(isoWeek);

type SortingConfiguration = { metric: 'alias' | 'work' | 'department'; orderingDirection: 'asc' | 'desc' };

const resolveStatusIndicatorIcon = (availabilityStatus?: string) => {
  switch (availabilityStatus) {
    case 'Occupato': return <DoNotDisturbOnTotalSilenceIcon sx={{ fontSize: 14 }} className="text-error" />;
    case 'Smart Working': return <HomeWorkIcon sx={{ fontSize: 14 }} className="text-info" />;
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-base-100 p-4 md:p-5 rounded-[2rem] border border-base-300 shadow-sm relative z-[90]">
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
          <div className="flex flex-wrap items-center justify-center gap-4 bg-base-200/50 py-3 px-4 rounded-[1.25rem] border border-base-300 shadow-inner">
            {headerCounts[activeMobileViewDate].map(item => (
              <div key={item.category.id_category} className="flex items-center gap-1.5" title={getDynamicCategoryName(item.category, i18n.language, t)}>
                <span className="text-xl flex items-center justify-center drop-shadow-sm">{getCategoryIcon(item.category)}</span>
                <span className="text-sm font-black text-base-content/60">{item.count}</span>
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
                <div key={profileEntity.id_user} className={`bg-base-100 rounded-3xl p-4 border flex items-center gap-4 shadow-sm ${mapsToAuthenticatedUser ? 'border-primary outline outline-2 outline-primary outline-offset-1' : 'border-base-300'}`}>
                  <div className="avatar shrink-0 relative" onClick={() => triggerNavigation(`/profile/${profileEntity.id_user}`)}>
                    <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden shadow-inner ${mapsToAuthenticatedUser ? 'border-primary' : 'border-base-300'}`}>
                      <img src={profileEntity.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileEntity.alias || profileEntity.full_name || 'U')}&background=random`} alt={profileEntity.alias} className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-base-100 rounded-full border border-base-200 shadow-sm p-[2px] z-10 flex items-center justify-center" title={mapStatusToTranslation(profileEntity.status)}>
                      {resolveStatusIndicatorIcon(profileEntity.status)}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden" onClick={() => triggerNavigation(`/profile/${profileEntity.id_user}`)}><div className="font-black text-base-content text-lg truncate uppercase tracking-tight flex items-center gap-2">{profileEntity.alias}<ArrowForwardIosIcon sx={{ fontSize: 12 }} className="text-base-content opacity-30" /></div><div className="text-[10px] text-base-content opacity-70 font-bold uppercase tracking-widest truncate">{profileEntity.work || t('profile.team_member', 'Team Member')}</div>{profileEntity.department && (<div className="text-[9px] text-primary-content font-black uppercase tracking-wider bg-primary px-2 py-0.5 rounded mt-1 inline-flex items-center gap-1 shadow-sm"><BusinessIcon sx={{ fontSize: 11 }} /> {profileEntity.department}</div>)}</div>
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
                    className={`shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl border-2 ${targetHoliday || (grantsModificationRights && !isWeekendDisabled) || (!grantsModificationRights && computedCategoryPayload) ? 'cursor-pointer' : ''} ${(localizedPresenceObject || (!isWeekendDisabled && profileEntity.default_category) || targetHoliday) ? 'bg-base-200 border-base-300' : 'border-dashed border-base-300 bg-base-200'}`}
                  >
                    <DayCell presence={localizedPresenceObject} defaultCategory={profileEntity.default_category} grantsEditPermissions={grantsModificationRights} onAddPresence={onAddPresence} userId={profileEntity.id_user} targetDate={activeMobileViewDate} canWorkWeekends={profileEntity.can_work_weekends} holidayName={targetHoliday?.name_holiday} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="hidden lg:block rounded-[2.5rem] border-2 border-base-300 bg-base-100 shadow-xl overflow-hidden relative z-10">
        <div className="overflow-x-auto w-full hide-scrollbar">
          <table className="table table-fixed w-full min-w-[1000px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-base-100">
                <th className="p-0 border-r-2 border-b-4 border-base-300 w-[320px] sticky left-0 top-0 z-[60] bg-base-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.2)]">
                  <div className="flex flex-col h-full divide-y divide-base-300 bg-base-100">
                    <div onClick={() => triggerSortingExecution('alias')} className="p-5 cursor-pointer hover:bg-base-200 transition-colors flex items-center justify-between group/sort">
                      <div><span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block mb-1">{t('calendar.employee', 'Employee')}</span><div className={`text-lg font-black tracking-tighter ${sortingConfiguration.metric === 'alias' ? 'text-primary' : 'text-base-content'}`}>{t('calendar.personal_data', 'Personal Data')}</div></div>
                      <div className={`transition-all duration-500 transform ${sortingConfiguration.metric === 'alias' ? 'opacity-100 scale-110' : 'opacity-0 scale-50'}`}><span className="inline-block font-black text-xl text-primary transform transition-transform duration-500" style={{ transform: sortingConfiguration.orderingDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}><ArrowUpwardIcon /></span></div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-base-300">
                      <div onClick={() => triggerSortingExecution('work')} className="px-5 py-3.5 cursor-pointer hover:bg-base-200 transition-colors flex items-center justify-between group/sort"><span className={`text-[10px] font-black uppercase tracking-widest truncate mr-1 ${sortingConfiguration.metric === 'work' ? 'text-primary' : 'text-base-content opacity-70'}`}>{t('admin.role', 'Role')}</span><div className={`transition-all duration-300 shrink-0 ${sortingConfiguration.metric === 'work' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}><span className="inline-block text-primary transform transition-transform duration-300" style={{ transform: sortingConfiguration.orderingDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}><ArrowUpwardIcon sx={{ fontSize: 16 }} /></span></div></div>
                      <div onClick={() => triggerSortingExecution('department')} className="px-5 py-3.5 cursor-pointer hover:bg-base-200 transition-colors flex items-center justify-between group/sort"><span className={`text-[10px] font-black uppercase tracking-widest truncate mr-1 ${sortingConfiguration.metric === 'department' ? 'text-primary' : 'text-base-content opacity-70'}`}>{t('admin.department', 'Department')}</span><div className={`transition-all duration-300 shrink-0 ${sortingConfiguration.metric === 'department' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}><span className="inline-block text-primary transform transition-transform duration-300" style={{ transform: sortingConfiguration.orderingDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}><ArrowUpwardIcon sx={{ fontSize: 16 }} /></span></div></div>
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
                      className={`p-0 align-top border-r-2 ${contextualBorderHighlight} cursor-pointer hover:bg-base-300 select-none transition-colors ${appliedHeaderCSSConfiguration} ${saturdaySeparatorClass}`}
                    >
                      <div className="flex flex-col h-full justify-between items-center py-4 relative">
                        <div className="text-center w-full">
                          <div className="text-[11px] uppercase font-black tracking-[0.15em] mb-1 opacity-80">{mappedDayNode.locale(i18n.language).format('ddd')}</div>
                          <div className={`text-2xl font-black tracking-tighter transition-transform duration-300 ${matchesFilterCriteria ? 'scale-110' : 'group-hover/th:scale-105'}`}>{mappedDayNode.locale(i18n.language).format('DD')}</div>
                        </div>
                        {!targetHoliday && activeCategories.length > 0 && (
                          <div className="mt-3 w-full flex flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] font-bold text-base-content/60 px-1 opacity-80">
                            {activeCategories.map(item => (
                              <span key={item.category.id_category} className="flex items-center gap-0.5" title={getDynamicCategoryName(item.category, i18n.language, t)}>
                                <span className="text-[12px] flex items-center justify-center">{getCategoryIcon(item.category)}</span> {item.count}
                              </span>
                            ))}
                          </div>
                        )}
                        {targetHoliday && (
                           <div className="mt-3 w-full flex flex-wrap justify-center px-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-error/80 text-center truncate w-full px-1" title={targetHoliday.name_holiday}>{targetHoliday.name_holiday}</span>
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
                  const sequentialRowColorTheme = iterationIndex % 2 !== 0 ? 'bg-base-200' : 'bg-base-100';

                  return (
                    <tr key={profileEntity.id_user} className={`group/row ${mapsToAuthenticatedUser ? 'outline outline-2 outline-primary outline-offset-[-2px] relative z-20' : ''} ${sequentialRowColorTheme}`}>
                      <td className={`relative p-0 border-r-2 border-base-300 sticky left-0 z-50 overflow-hidden shadow-[4px_0_10px_-4px_rgba(0,0,0,0.15)] ${sequentialRowColorTheme}`}>
                        <div className="relative z-10 flex flex-col h-full divide-y divide-base-300">
                          <div className="p-5 pl-6 flex items-center gap-4 cursor-pointer hover:bg-base-300 transition-colors relative" onClick={() => triggerNavigation(`/profile/${profileEntity.id_user}`)}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-base-300 z-20`}><div className={`w-full bg-primary transition-all duration-500 ease-out ${mapsToAuthenticatedUser ? 'h-full shadow-[0_0_8px_var(--p)]' : 'h-0 group-hover/row:h-full'}`}></div></div>
                            <div className={`avatar shrink-0 relative transition-all duration-500 group-hover/row:scale-110 ${mapsToAuthenticatedUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100 rounded-2xl' : ''}`}>
                              <div className="w-14 h-14 rounded-2xl border-2 border-base-300 shadow-md overflow-hidden bg-base-300">
                                <img src={profileEntity.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profileEntity.alias || profileEntity.full_name || 'U')}&background=random`} alt={profileEntity.alias} className="object-cover w-full h-full" />
                              </div>
                              <div className="absolute -bottom-1.5 -right-1.5 bg-base-100 rounded-full border border-base-200 shadow-sm p-[2px] z-10 flex items-center justify-center" title={mapStatusToTranslation(profileEntity.status)}>
                                {resolveStatusIndicatorIcon(profileEntity.status)}
                              </div>
                            </div>
                            <div className="overflow-hidden relative z-20"><div className="font-black text-base-content text-lg truncate group-hover/row:text-primary transition-colors uppercase tracking-tight flex items-center gap-1.5">{profileEntity.alias}{mapsToAuthenticatedUser && <div className="text-[9px] text-primary-content font-black uppercase tracking-widest bg-primary px-1.5 py-0.5 rounded shadow-md">{t('profile.you', 'You')}</div>}</div><div className="text-[10px] text-base-content opacity-60 font-medium truncate mt-0.5">{profileEntity.full_name}</div></div>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-base-300 font-bold text-xs uppercase tracking-widest text-base-content opacity-70">
                            <div className="px-5 py-3 truncate" title={profileEntity.work || t('profile.team_member', 'Team Member')}>{profileEntity.work || t('profile.team_member', 'Team Member')}</div>
                            <div className="px-5 py-3 truncate text-primary flex items-center gap-1.5" title={profileEntity.department}><BusinessIcon sx={{ fontSize: 14 }} className="opacity-70" /> {profileEntity.department}</div>
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
                          <td key={serializedDateReference} className={`p-0 border-r border-base-300 relative ${isWeekendDisabled || targetHoliday ? '' : 'hover:bg-base-300'} ${responsiveCellBackground} ${saturdaySeparatorClass}`}>
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
          <div className="absolute inset-0 bg-base-300/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setOverlayContextProperties(null)}></div>
          <div className="bg-base-100 border border-base-300 shadow-2xl rounded-[2rem] p-8 text-center relative z-10 w-full max-w-sm animate-fade-in-up">
            <button onClick={() => setOverlayContextProperties(null)} className="btn btn-sm btn-ghost btn-circle absolute right-4 top-4 text-base-content/50">✕</button>
            <div className="w-20 h-20 bg-base-200 border-2 border-base-300 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6 text-primary shadow-sm">
              {overlayContextProperties.isHoliday ? (
                  <CelebrationIcon fontSize="large" className="text-error scale-150" />
              ) : (
                  getCategoryIcon(overlayContextProperties.categoryData)
              )}
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-base-content mb-2">{overlayContextProperties.catName}</h3>
            <div className="inline-flex items-center gap-2 bg-base-200 text-base-content/80 px-4 py-2 rounded-xl mt-2 font-medium text-xs border border-base-300">
              <span className="font-semibold text-primary">{overlayContextProperties.userName}</span>
              <span className="w-1 h-1 bg-base-300 rounded-full"></span>
              <span>{overlayContextProperties.date}</span>
            </div>
            {overlayContextProperties.isDefault && (
                <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-base-content/40 italic">
                    {t('profile.optional', 'Default Location')}
                </div>
            )}
            <div className="w-full mt-8">
              <button onClick={() => setOverlayContextProperties(null)} className="btn btn-primary w-full rounded-xl font-semibold text-sm h-11 min-h-0 uppercase tracking-wider shadow-lg shadow-primary/20">
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