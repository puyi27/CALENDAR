import { useState, useMemo, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { API_URL } from '../config';

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DoNotDisturbOnTotalSilenceIcon from '@mui/icons-material/DoNotDisturbOnTotalSilence';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import HomeWorkIcon from '@mui/icons-material/HomeWork';

import { CalendarFilters } from './calendar/CalendarFilters';
import { MobileCalendar } from './calendar/MobileCalendar';
import { DesktopCalendar } from './calendar/DesktopCalendar';
import { OverlayPortal } from './calendar/OverlayPortal';

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
  const { t } = useTranslation();
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
  const [overlayContextProperties, setOverlayContextProperties] = useState<any>(null);
  const [holidays, setHolidays] = useState<{date: string, name_holiday: string}[]>([]);

  const MAX_RECORDS_PER_PAGE = 25;
  const scrollableMobileContainerRef = useRef<HTMLDivElement>(null);

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

    peerDataset.sort((recordA: any, recordB: any) => {
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
    const datesToProcess = new Set([...localizedWeekCollection.map(d => d.format('YYYY-MM-DD')), activeMobileViewDate]);

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
           if (!cat && !isWeekendDisabled && u.default_category) cat = u.default_category;
        }
        if (cat) {
          const existing = dayCounts.get(cat.id_category);
          if (existing) existing.count++; else dayCounts.set(cat.id_category, { count: 1, category: cat });
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

  const onAddPresence = (userId: number, date: string) => setInteractionModalContext({ id_user: userId, date });

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-10">
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <CalendarFilters 
        searchQueryString={searchQueryString}
        setSearchQueryString={setSearchQueryString}
        selectedDepartmentFilter={selectedDepartmentFilter}
        setSelectedDepartmentFilter={setSelectedDepartmentFilter}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        uniqueActiveDepartments={uniqueActiveDepartments}
        categories={categories}
        activeDropdownContext={activeDropdownContext}
        setActiveDropdownContext={setActiveDropdownContext}
        referenceDateObject={referenceDateObject}
        setReferenceDateObject={setReferenceDateObject}
        triggerResetToPresentDate={triggerResetToPresentDate}
        initialWeeklyBound={initialWeeklyBound}
        terminalWeeklyBound={terminalWeeklyBound}
      />

      <MobileCalendar 
        extendedMobileDateCollection={extendedMobileDateCollection}
        activeMobileViewDate={activeMobileViewDate}
        setActiveMobileViewDate={setActiveMobileViewDate}
        setActiveDateFilter={setActiveDateFilter}
        executeScrollToTargetDate={executeScrollToTargetDate}
        holidays={holidays}
        headerCounts={headerCounts}
        formattedUserDataset={formattedUserDataset}
        currentUser={currentUser}
        onAddPresence={onAddPresence}
        setOverlayContextProperties={setOverlayContextProperties}
        scrollableMobileContainerRef={scrollableMobileContainerRef}
        resolveStatusIndicatorIcon={resolveStatusIndicatorIcon}
        mapStatusToTranslation={mapStatusToTranslation}
      />

      <DesktopCalendar 
        localizedWeekCollection={localizedWeekCollection}
        activeDateFilter={activeDateFilter}
        setActiveDateFilter={setActiveDateFilter}
        holidays={holidays}
        headerCounts={headerCounts}
        formattedUserDataset={formattedUserDataset}
        currentUser={currentUser}
        onAddPresence={onAddPresence}
        setOverlayContextProperties={setOverlayContextProperties}
        sortingConfiguration={sortingConfiguration}
        triggerSortingExecution={triggerSortingExecution}
        resolveStatusIndicatorIcon={resolveStatusIndicatorIcon}
        mapStatusToTranslation={mapStatusToTranslation}
      />

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

      <OverlayPortal overlayContextProperties={overlayContextProperties} setOverlayContextProperties={setOverlayContextProperties} />
    </div>
  );
};