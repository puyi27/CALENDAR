import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'react-i18next'; 
import toast from 'react-hot-toast';
import { type User, type Presence, type Category } from '../types';
import { useStore } from '../store/useStore';
import { getDynamicCategoryName, getCategoryIcon, getCategoryColorClass } from '../utils/categoryUtils';
import { API_URL } from '../config';

import DoNotDisturbOnTotalSilenceIcon from '@mui/icons-material/DoNotDisturbOnTotalSilence';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import EditIcon from '@mui/icons-material/Edit';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import PasswordIcon from '@mui/icons-material/Password';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CelebrationIcon from '@mui/icons-material/Celebration';

dayjs.extend(isoWeek);

export const ProfilePage = (props: any) => {
  const { t, i18n } = useTranslation(); 
  const { id_user } = useParams();
  const triggerNavigation = useNavigate();
  
  const store = useStore();
  const users: User[] = props.users || store.users || [];
  const categories: Category[] = props.categories || store.categories || [];
  const currentUser: User | null = props.currentUser || store.currentUser;
  
  const onUpdateUser = props.onUpdateUser || store.updateUser;
  const onAddPresence = props.onAddPresence || ((userId: number, date: string) => store.setInteractionModalContext({ id_user: userId, date }));
  const commitBulkPresences = store.commitBulkPresences;

  const focusedUserProfile = users.find(u => u.id_user === Number(id_user));
  const identifiesAuthorizedSession = focusedUserProfile?.id_user === currentUser?.id_user;
  
  const [navigationalDatePivot, setNavigationalDatePivot] = useState(dayjs());
  const [triggersEditMutation, setTriggersEditMutation] = useState(false);
  const [dropdownAvailabilityTrigger, setDropdownAvailabilityTrigger] = useState(false);
  const avatarUploadNodeRef = useRef<HTMLInputElement>(null);
  
  const [overlayContextProperties, setOverlayContextProperties] = useState<{date: string, catName: string, categoryData: any, userName?: string, isDefault?: boolean, isHoliday?: boolean} | null>(null);
  const [isCustomFillModalOpen, setIsCustomFillModalOpen] = useState(false);
  const [isClearMonthModalOpen, setIsClearMonthModalOpen] = useState(false);
  const [holidays, setHolidays] = useState<{date: string, name_holiday: string}[]>([]);
  
  const [customFillPattern, setCustomFillPattern] = useState<Record<number, string>>(() => {
    if (focusedUserProfile) {
      const saved = localStorage.getItem(`customMonthPattern_${focusedUserProfile.id_user}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      const defaultId = focusedUserProfile.default_category_id?.toString() || '';
      return { 1: defaultId, 2: defaultId, 3: defaultId, 4: defaultId, 5: defaultId, 6: '', 7: '' };
    }
    return { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '' };
  });

  const [formInputRegistry, setFormInputRegistry] = useState({
    alias: focusedUserProfile?.alias || '', 
    full_name: focusedUserProfile?.full_name || '',
    email: focusedUserProfile?.email || '',
    phoneNumber: focusedUserProfile?.phoneNumber || '',
    work: focusedUserProfile?.work || '',
    avatar: focusedUserProfile?.avatar || '', 
    description: focusedUserProfile?.description || '', 
    status: focusedUserProfile?.status || 'Disponibile',
    default_category_id: focusedUserProfile?.default_category_id || '',
    can_work_weekends: focusedUserProfile?.can_work_weekends || false,
    password: ''
  });

  const parsedPresenceMap = useMemo(() => {
    const presenceAccumulator: Record<string, Presence> = {};
    focusedUserProfile?.presences?.forEach((entryNode: any) => { presenceAccumulator[entryNode.date] = entryNode; });
    return presenceAccumulator;
  }, [focusedUserProfile]);

  useEffect(() => {
    if (!store.token) return;
    fetch(`${API_URL}/holidays`, { headers: { 'Authorization': `Bearer ${store.token}` } })
      .then(res => res.json())
      .then(data => setHolidays(data || []))
      .catch(() => {});
  }, [store.token]);

  if (users.length === 0) return <div className="flex h-96 items-center justify-center"><span className="loading loading-spinner text-primary loading-lg"></span></div>;
  if (!focusedUserProfile) return <Navigate to="/" />;

  const boundingMonthStart = navigationalDatePivot.startOf('month');
  const evaluatedDaysInMonth = navigationalDatePivot.daysInMonth();
  const prependedEmptyGridSlots = boundingMonthStart.isoWeekday() - 1;
  
  const iterativeDaysArray = Array.from({ length: evaluatedDaysInMonth }, (_, indexIncrement) => boundingMonthStart.add(indexIncrement, 'day'));
  const placeholderGridArray = Array.from({ length: prependedEmptyGridSlots }, (_, indexIncrement) => indexIncrement);
  
  const extractedDayLabels = t('profile.days', { returnObjects: true });
  const finalGridHeaderLabels = Array.isArray(extractedDayLabels) ? extractedDayLabels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const commitProfileConfigurationChanges = () => {
    const identifiesEmptyAvatarString = formInputRegistry.avatar.trim() === '';
    const assignedAvatarEndpoint = identifiesEmptyAvatarString ? `https://ui-avatars.com/api/?name=${encodeURIComponent(formInputRegistry.alias)}&background=random` : formInputRegistry.avatar;
    
    const finalizedRequestPayload: any = { ...focusedUserProfile, ...formInputRegistry, avatar: assignedAvatarEndpoint };
    if (!formInputRegistry.password || formInputRegistry.password.trim() === '') {
      delete finalizedRequestPayload.password;
    }
    if (!formInputRegistry.default_category_id) {
      finalizedRequestPayload.default_category_id = null;
    }

    if (onUpdateUser) onUpdateUser(finalizedRequestPayload);
    setFormInputRegistry(prevRecord => ({ ...prevRecord, avatar: assignedAvatarEndpoint, password: '' }));
    setTriggersEditMutation(false);
    toast.success(t('profile.save', 'Cambios guardados con éxito'));
  };

  const dispatchEditInitialization = () => {
    setFormInputRegistry({ 
      alias: focusedUserProfile?.alias || '', 
      full_name: focusedUserProfile?.full_name || '',
      email: focusedUserProfile?.email || '',
      phoneNumber: focusedUserProfile?.phoneNumber || '',
      work: focusedUserProfile?.work || '',
      avatar: focusedUserProfile?.avatar || '', 
      description: focusedUserProfile?.description || '', 
      status: focusedUserProfile?.status || 'Disponibile', 
      default_category_id: focusedUserProfile?.default_category_id || '',
      can_work_weekends: focusedUserProfile?.can_work_weekends || false,
      password: '' 
    }); 
    setTriggersEditMutation(true);
  };

  const executeBulkMonthFill = async () => {
    const defaultCategory = focusedUserProfile.default_category;
    
    if (!defaultCategory) {
      toast.error(t('profile.no_default_category', 'Sin ubicación predeterminada configurada'));
      return;
    }

    const defaultCategoryId = defaultCategory.id_category;
    const derivedMissingPresences: any[] = [];
    const datesToDelete: string[] = [];
    const currentDateReference = dayjs().startOf('day');

    iterativeDaysArray.forEach(day => {
      if (day.isBefore(currentDateReference)) return;

      const isolatedDateString = day.format('YYYY-MM-DD');
      if (holidays.some(h => h.date === isolatedDateString)) return;

      const weekDay = day.isoWeekday();
      if (weekDay < 6 || focusedUserProfile.can_work_weekends) {
        const chosenCategoryId = customFillPattern[weekDay] || defaultCategoryId;
        
        if (chosenCategoryId) {
          if (parsedPresenceMap[isolatedDateString]) {
            datesToDelete.push(isolatedDateString);
          }
          derivedMissingPresences.push({ 
            id_user: focusedUserProfile.id_user, 
            date: isolatedDateString, 
            id_category: Number(chosenCategoryId)
          });
        }
      }
    });

    if (derivedMissingPresences.length > 0) {
      try {
        if (datesToDelete.length > 0) {
          const queries = datesToDelete.map(date => 
            fetch(`${API_URL}/presences`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(store as any).token}` },
              body: JSON.stringify({ id_user: focusedUserProfile.id_user, date: date })
            })
          );
          await Promise.all(queries);
        }
        if (commitBulkPresences) await commitBulkPresences(derivedMissingPresences);
        if ((store as any).fetchGlobalData) await (store as any).fetchGlobalData();
        toast.success(t('profile.bulk_success', 'Mes autocompletado'));
      } catch (error) {
        toast.error('Error aplicando autocompletar');
      }
    } else {
      toast.error(t('profile.bulk_empty', 'No hay días futuros para rellenar'));
    }
  };

  const saveCustomFillPattern = () => {
    localStorage.setItem(`customMonthPattern_${focusedUserProfile.id_user}`, JSON.stringify(customFillPattern));
    setIsCustomFillModalOpen(false);
    toast.success(t('profile.save', 'Patrón guardado'));
  };

  const executeBulkMonthClear = async () => {
    setIsClearMonthModalOpen(false);
    const datesToDelete: string[] = [];
    const currentDateReference = dayjs().startOf('day');

    iterativeDaysArray.forEach(day => {
      if (day.isBefore(currentDateReference)) return;

      const isolatedDateString = day.format('YYYY-MM-DD');
      if (parsedPresenceMap[isolatedDateString]) {
        datesToDelete.push(isolatedDateString);
      }
    });

    if (datesToDelete.length === 0) {
      toast.success(t('profile.clear_empty', 'No hay presencias futuras que borrar'));
      return;
    }

    try {
      const queries = datesToDelete.map(date => 
        fetch(`${API_URL}/presences`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(store as any).token}` },
          body: JSON.stringify({ id_user: focusedUserProfile.id_user, date: date })
        })
      );
      await Promise.all(queries);
      if ((store as any).fetchGlobalData) await (store as any).fetchGlobalData();
      toast.success(t('profile.clear_success', 'Mes vaciado correctamente'));
    } catch (error) {
      toast.error('Error al vaciar el mes');
    }
  };

  const handleCopyCalendarLink = () => {
    const token = (focusedUserProfile as any).calendar_token;
    if (!token) return toast.error('Token no generado aún');
    const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:4000' : window.location.origin;
    const link = `${baseUrl}/api/calendar/${token}.ics`;
    navigator.clipboard.writeText(link);
    toast.success(t('profile.calendar_link_copied', 'Enlace copiado'));
  };

  const parseImageUploadStream = (domEvent: React.ChangeEvent<HTMLInputElement>) => {
    const targetFileInstance = domEvent.target.files?.[0];
    if (targetFileInstance) {
      if (targetFileInstance.size > 2 * 1024 * 1024) return toast.error("El tamaño del archivo excede el máximo de 2MB.");
      const fileStreamReader = new FileReader();
      fileStreamReader.onloadend = () => setFormInputRegistry(prevRecord => ({ ...prevRecord, avatar: fileStreamReader.result as string }));
      fileStreamReader.readAsDataURL(targetFileInstance);
    }
  };

  const evaluateStatusIndicatorType = (statusString: string) => {
    switch (statusString) {
      case 'Occupato': return <DoNotDisturbOnTotalSilenceIcon fontSize="small" className="text-error" />;
      case 'Smart Working': return <HomeWorkIcon fontSize="small" className="text-success" />;
      case 'In Ferie': return <BeachAccessIcon fontSize="small" className="text-warning" />;
      case 'Disponibile': default: return <OnlinePredictionIcon fontSize="small" className="text-success" />;
    }
  };

  const staticAvailabilityOptions = [
    { value: 'Disponibile', label: t('profile.status_disponibile', 'Disponible') },
    { value: 'Occupato', label: t('profile.status_occupato', 'Ocupado') },
    { value: 'Smart Working', label: t('profile.status_smart_working', 'Smart Working') },
    { value: 'In Ferie', label: t('profile.status_in_ferie', 'De Vacaciones') }
  ];

  const filteredDepartments = categories?.filter(c => {
    const icon = c.icon || '';
    const name = (c.name || '').toLowerCase();
    return icon !== 'BeachAccess' && icon !== 'Sick' && icon !== 'Flight' && 
           !name.includes('ferie') && !name.includes('malattia') && !name.includes('travel') && !name.includes('trasferta');
  });

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 relative animate-fade-in pb-28 md:pb-10">
        <div className="mb-6">
           <button onClick={() => triggerNavigation(-1)} className="btn btn-ghost gap-2 pl-2 hover:bg-base-300 rounded-xl transition-all">
             <ArrowBackIcon fontSize="small" />
             <span className="font-bold uppercase tracking-widest text-xs">{t('app.cancel', 'Atrás')}</span>
           </button>
        </div>

        <div className="bg-base-100 rounded-[2rem] p-6 md:p-8 shadow-lg border border-base-300 border-t-4 border-t-primary/30 flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 md:mb-10 relative overflow-hidden transition-all hover:shadow-xl" style={{background: 'linear-gradient(135deg, var(--fallback-b1,oklch(var(--b1))) 60%, color-mix(in oklch, oklch(var(--p)) 5%, var(--fallback-b1,oklch(var(--b1)))))' }}>
          <div className="absolute top-0 right-0 p-4 md:p-6 flex items-center gap-2 md:gap-3 z-20">
            {identifiesAuthorizedSession && (
              <>
                <button onClick={handleCopyCalendarLink} className="btn btn-outline btn-sm rounded-xl font-semibold uppercase tracking-wider text-xs border-base-300 hover:bg-secondary hover:border-secondary hover:text-secondary-content gap-2 transition-all">
                  <CalendarMonthIcon fontSize="small"/> <span className="hidden md:inline">Sync iCal</span>
                </button>
                <button onClick={dispatchEditInitialization} className="btn btn-outline btn-sm rounded-xl font-semibold uppercase tracking-wider text-xs border-base-300 hover:bg-primary hover:border-primary hover:text-primary-content gap-2 transition-all">
                  <EditIcon fontSize="small"/> <span className="hidden md:inline">{t('profile.edit', 'Editar')}</span>
                </button>
              </>
            )}
          </div>
          
          <div className="relative group z-10 mx-auto md:mx-0 mt-4 md:mt-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl ring-4 ring-primary/20 ring-offset-2 ring-offset-base-100 shadow-xl bg-base-200 overflow-hidden transition-all group-hover:ring-primary/40">
              <img src={focusedUserProfile.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(focusedUserProfile.alias || focusedUserProfile.full_name || 'U')}&background=random`} alt={focusedUserProfile.alias} className="object-cover w-full h-full" />
            </div>
            {focusedUserProfile.status && (
              <div className="absolute -bottom-2 -right-2 bg-base-100 rounded-xl border-2 border-base-200 flex items-center justify-center shadow-lg px-3 py-2 z-10 transition-all group-hover:scale-110 group-hover:shadow-xl">
                <span className="flex items-center justify-center" title={focusedUserProfile.status}>{evaluateStatusIndicatorType(focusedUserProfile.status)}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-[200px] z-10 text-center md:text-left pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-base-content/50 block mb-1.5">{t('profile.personal_profile', 'Perfil Personal')}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-base-content mb-2">{focusedUserProfile.full_name || focusedUserProfile.alias}</h2>
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 sm:gap-6 text-sm font-medium text-base-content/60 mb-4">
              {focusedUserProfile.email && <span className="flex items-center gap-1.5"><AlternateEmailIcon fontSize="small" /> {focusedUserProfile.email}</span>}
              {focusedUserProfile.phoneNumber && <span className="flex items-center gap-1.5"><PhoneIcon fontSize="small" /> {focusedUserProfile.phoneNumber}</span>}
            </div>
            {focusedUserProfile.description && <p className="text-sm font-medium text-base-content/70 italic mb-4 max-w-md mx-auto md:mx-0 leading-relaxed">"{focusedUserProfile.description}"</p>}
            <div className="flex gap-2 justify-center md:justify-start">
              <span className="badge bg-base-200 border border-base-300 text-base-content font-semibold px-3 py-3 uppercase text-[10px] tracking-wider rounded-lg">
                {focusedUserProfile.work || t('profile.team_member', 'Miembro del Equipo')}
              </span>
              {identifiesAuthorizedSession && <span className="badge bg-primary border-none text-primary-content font-bold px-3 py-3 uppercase text-[10px] tracking-wider rounded-lg shadow-sm">{t('profile.you', 'Tú')}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-base-100 shadow-md border border-base-300 p-2.5 rounded-full mb-6 border-l-4 border-l-secondary/40">
          <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-start pl-1">
            <div className="flex items-center bg-base-200/50 rounded-full h-11 px-1 border border-base-200 shadow-inner">
              <button onClick={() => setNavigationalDatePivot(c => c.subtract(1, 'month'))} className="btn btn-sm btn-ghost hover:bg-base-300 rounded-full h-9 w-9 p-0 text-base-content/70"><KeyboardArrowLeftIcon fontSize="small"/></button>
              <h3 className="text-sm font-black capitalize tracking-wide text-base-content min-w-[130px] text-center px-1">
                {navigationalDatePivot.locale(i18n.language).format('MMMM YYYY')}
              </h3>
              <button onClick={() => setNavigationalDatePivot(c => c.add(1, 'month'))} className="btn btn-sm btn-ghost hover:bg-base-300 rounded-full h-9 w-9 p-0 text-base-content/70"><KeyboardArrowRightIcon fontSize="small"/></button>
            </div>
            <button onClick={() => setNavigationalDatePivot(dayjs())} className="btn btn-secondary border-none rounded-full text-xs font-black uppercase tracking-widest h-11 px-6 shadow-md min-h-0">
              {t('profile.today', 'Hoy')}
            </button>
          </div>

          {identifiesAuthorizedSession && (
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center lg:justify-end pr-1">
              <button onClick={executeBulkMonthFill} className="btn btn-outline border-base-200 text-base-content hover:bg-base-200 hover:border-base-300 rounded-full text-xs font-bold uppercase tracking-wider h-11 px-5 shadow-sm flex items-center gap-2 min-h-0 bg-base-100">
                <AutoFixHighIcon fontSize="small" /> <span className="hidden sm:inline">{t('profile.fill_month', 'Autocompletar')}</span>
              </button>
              <button onClick={() => setIsCustomFillModalOpen(true)} className="btn btn-outline border-base-200 text-base-content hover:bg-base-200 hover:border-base-300 rounded-full text-xs font-bold uppercase tracking-wider h-11 px-5 shadow-sm flex items-center gap-2 min-h-0 bg-base-100">
                <SettingsSuggestIcon fontSize="small" /> <span className="hidden sm:inline">{t('profile.custom', 'Patrón')}</span>
              </button>
              <button onClick={() => setIsClearMonthModalOpen(true)} className="btn btn-outline border-error/30 text-error hover:bg-error hover:text-white rounded-full h-11 w-11 p-0 flex items-center justify-center shadow-sm min-h-0 bg-base-100">
                <DeleteSweepIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-base-100 rounded-[2rem] shadow-xl border-2 border-base-300 overflow-hidden pb-6">
          <div className="grid grid-cols-7 border-b-2 border-base-300" style={{background: 'linear-gradient(180deg, var(--fallback-b2,oklch(var(--b2))) 0%, var(--fallback-b1,oklch(var(--b1))) 100%)'}}>
            {finalGridHeaderLabels.map((d: string) => <div key={d} className="py-4 text-center text-[10px] font-black text-base-content/50 uppercase tracking-[0.2em]">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 divide-x divide-base-300/60">
            {placeholderGridArray.map(b => <div key={`blank-${b}`} className="min-h-[80px] md:min-h-[120px] bg-base-200/30 border-b border-base-300/50"></div>)}
            {iterativeDaysArray.map(evaluatingDayNode => {
              const isolatedDateString = evaluatingDayNode.format('YYYY-MM-DD');
              const queriedPresenceEntity = parsedPresenceMap[isolatedDateString];
              const representsWeekendConstraint = evaluatingDayNode.isoWeekday() >= 6 && !focusedUserProfile.can_work_weekends;
              const impliesPresentConstraint = evaluatingDayNode.isSame(dayjs(), 'day');
              const targetHoliday = holidays.find(h => h.date === isolatedDateString);

              const validatesActiveDataOverride = queriedPresenceEntity && queriedPresenceEntity.categories;
              const mappedVisualCategory = validatesActiveDataOverride ? queriedPresenceEntity.categories : (representsWeekendConstraint || targetHoliday ? null : focusedUserProfile.default_category);
              const confirmsGhostEntityRender = !validatesActiveDataOverride && !representsWeekendConstraint && !targetHoliday && focusedUserProfile.default_category;

              const runtimeAppliedColorSyntax = getCategoryColorClass(mappedVisualCategory);
              
              const isClickable = (identifiesAuthorizedSession && !representsWeekendConstraint && !targetHoliday) || (!identifiesAuthorizedSession && mappedVisualCategory && !targetHoliday) || !!targetHoliday;

              return (
                <div 
                  key={isolatedDateString} 
                  className={`min-h-[80px] md:min-h-[120px] border-b border-base-300/50 p-1 md:p-3 relative group transition-colors duration-200 ${representsWeekendConstraint || targetHoliday ? 'bg-base-200/50' : 'bg-base-100 hover:bg-base-200/30'} ${impliesPresentConstraint ? 'bg-primary/[0.03]' : ''} ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (targetHoliday) {
                       setOverlayContextProperties({
                          date: evaluatingDayNode.locale(i18n.language).format('DD MMM YYYY'),
                          catName: targetHoliday.name_holiday,
                          categoryData: null,
                          userName: focusedUserProfile.alias || focusedUserProfile.full_name,
                          isHoliday: true
                       });
                       return;
                    }
                    if (identifiesAuthorizedSession && !representsWeekendConstraint) {
                       onAddPresence(focusedUserProfile.id_user, isolatedDateString);
                    } else if (mappedVisualCategory) {
                       setOverlayContextProperties({
                          date: evaluatingDayNode.locale(i18n.language).format('DD MMM YYYY'),
                          catName: getDynamicCategoryName(mappedVisualCategory, i18n.language, t),
                          categoryData: mappedVisualCategory,
                          userName: focusedUserProfile.alias || focusedUserProfile.full_name,
                          isDefault: !!confirmsGhostEntityRender
                       });
                    }
                  }}
                >
                  <div className="flex justify-center md:justify-between items-start mb-1 md:mb-2 pointer-events-none">
                    <span className={`text-[10px] md:text-sm font-semibold transition-colors ${impliesPresentConstraint ? 'bg-primary text-primary-content w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-md md:rounded-lg shadow-sm font-extrabold' : 'text-base-content/50'}`}>{evaluatingDayNode.format('D')}</span>
                  </div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-5 md:pt-8 px-1 pointer-events-none">
                    {targetHoliday ? (
                      <div className="flex flex-col items-center justify-center text-error w-full">
                         <CelebrationIcon fontSize="medium" className="opacity-80 mb-0.5 md:mb-1 md:!text-[35px]" />
                         <span className="hidden md:block text-[8px] md:text-[9px] font-extrabold uppercase tracking-widest text-center px-1 opacity-80 w-full truncate" title={targetHoliday.name_holiday}>{targetHoliday.name_holiday}</span>
                      </div>
                    ) : mappedVisualCategory ? (
                      <div className={`flex flex-col items-center gap-0.5 md:gap-1 w-full px-1 ${identifiesAuthorizedSession && !representsWeekendConstraint ? 'group-hover:scale-105 transition-transform' : ''}`}>
                        <div className={`text-2xl md:text-4xl flex items-center justify-center transition-colors group-hover:opacity-80 ${confirmsGhostEntityRender ? 'opacity-40 grayscale grayscale-[50%]' : runtimeAppliedColorSyntax}`}>
                          {getCategoryIcon(mappedVisualCategory)}
                        </div>
                        <span className={`hidden md:block text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-center w-full truncate px-1 ${confirmsGhostEntityRender ? 'text-base-content/40' : 'text-base-content/60 group-hover:text-base-content'}`} title={getDynamicCategoryName(mappedVisualCategory, i18n.language, t)}>
                          {getDynamicCategoryName(mappedVisualCategory, i18n.language, t)}
                        </span>
                      </div>
                    ) : (
                      identifiesAuthorizedSession && !representsWeekendConstraint && (
                        <div className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl border-2 border-dashed border-base-300 flex items-center justify-center text-base-content/40 transition-colors bg-base-100 shadow-sm hover:border-primary hover:text-primary">
                            <AddIcon fontSize="small" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isCustomFillModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setIsCustomFillModalOpen(false)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-md p-8 relative z-10 animate-fade-in-up flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold tracking-tight text-base-content flex items-center gap-2">
                <SettingsSuggestIcon className="text-primary" /> {t('profile.custom_month', 'Autocompletar Mes')}
              </h3>
              <button onClick={() => setIsCustomFillModalOpen(false)} className="btn btn-circle btn-ghost btn-sm">✕</button>
            </div>
            <p className="text-sm text-base-content/60 font-medium">{t('profile.custom_month_desc', 'Configura tu ubicación por defecto para cada día de la semana.')}</p>
            <div className="flex flex-col gap-5 pt-2">
              {[1, 2, 3, 4, 5, ...(focusedUserProfile.can_work_weekends ? [6, 7] : [])].map(dayNumber => (
                <div key={dayNumber} className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-base-content/50 ml-1">
                    {dayjs().isoWeekday(dayNumber).locale(i18n.language).format('dddd')}
                  </label>
                  <select 
                    className="select select-bordered w-full bg-base-100 rounded-xl focus:border-primary font-semibold text-sm h-12 border-base-300 shadow-sm transition-all"
                    value={customFillPattern[dayNumber]}
                    onChange={(e) => setCustomFillPattern({ ...customFillPattern, [dayNumber]: e.target.value })}
                  >
                    <option value="">---</option>
                    {categories?.filter(c => {
                      const icon = c.icon || '';
                      const name = (c.name || '').toLowerCase();
                      return icon !== 'BeachAccess' && icon !== 'Sick' && icon !== 'Flight' && 
                             !name.includes('ferie') && !name.includes('malattia') && !name.includes('travel') && !name.includes('trasferta');
                    }).map(c => (
                      <option key={c.id_category} value={c.id_category}>
                        {getDynamicCategoryName(c, i18n.language, t)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-base-200">
              <button type="button" onClick={() => setIsCustomFillModalOpen(false)} className="btn btn-ghost rounded-xl">{t('profile.cancel', 'Cancelar')}</button>
              <button type="button" onClick={saveCustomFillPattern} className="btn btn-primary rounded-xl shadow-md">{t('profile.save', 'Guardar')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isClearMonthModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setIsClearMonthModalOpen(false)}></div>
          <div className="bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 w-full max-w-sm p-8 relative z-10 text-center flex flex-col gap-6">
            <div className="w-16 h-16 bg-error/10 border-2 border-error/20 rounded-2xl flex items-center justify-center mx-auto text-error shadow-sm">
              <DeleteSweepIcon fontSize="large" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-base-content mb-2">{t('profile.clear_month', 'Vaciar Mes')}</h3>
              <p className="text-sm text-base-content/60 font-medium">{t('profile.confirm_clear_month', '¿Estás seguro de que quieres borrar todas tus presencias de este mes?')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setIsClearMonthModalOpen(false)} className="btn btn-ghost rounded-xl">{t('profile.cancel', 'Cancelar')}</button>
              <button type="button" onClick={executeBulkMonthClear} className="btn btn-error rounded-xl shadow-md text-white">{t('profile.confirm', 'Borrar Todo')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {overlayContextProperties && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-base-300/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setOverlayContextProperties(null)}></div>
          <div className="bg-base-100 border border-base-300 shadow-xl rounded-[2rem] p-8 text-center relative z-10 w-full max-w-sm animate-fade-in-up">
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
              <span className="font-semibold text-primary">{overlayContextProperties.userName || focusedUserProfile.alias}</span>
              <span className="w-1 h-1 bg-base-300 rounded-full"></span>
              <span>{overlayContextProperties.date}</span>
            </div>
            {overlayContextProperties.isDefault && (
                <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-base-content/40 italic">
                    {t('profile.optional', 'Ubicación predeterminada')}
                </div>
            )}
            <div className="w-full mt-8">
              <button onClick={() => setOverlayContextProperties(null)} className="btn btn-primary w-full rounded-xl font-semibold text-sm h-11 min-h-0 uppercase tracking-wider shadow-lg shadow-primary/20">
                {t('admin.btn_accept', 'Aceptar')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {triggersEditMutation && createPortal(
        <div className="fixed inset-0 z-[999] overflow-y-auto flex justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setTriggersEditMutation(false)}></div>
          <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 w-full max-w-xl relative z-10 p-6 md:p-8 flex flex-col gap-6 my-auto animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-base-content">{t('profile.customize', 'Configuración de Perfil')}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50">{t('profile.business_card', 'Tarjeta de presentación')}</span>
              </div>
              <button onClick={() => setTriggersEditMutation(false)} className="btn btn-circle btn-ghost btn-sm text-base-content/50">✕</button>
            </div>
            
            <div className="space-y-4 pt-1">
              <div className="flex gap-4 items-center bg-base-200/50 p-4 rounded-2xl border border-base-300 relative group transition-colors hover:bg-base-200/80">
                <div className="avatar flex-shrink-0 relative">
                  <div className="w-16 h-16 rounded-2xl bg-base-300 border-2 border-base-300 overflow-hidden cursor-pointer group-hover:opacity-80 transition-opacity" onClick={() => avatarUploadNodeRef.current?.click()}>
                    <img src={formInputRegistry.avatar || `https://ui-avatars.com/api/?name=${formInputRegistry.alias}`} alt="Avatar" className="object-cover w-full h-full" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-base-content/70">
                    <PhotoCameraIcon fontSize="small" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('profile.avatar_url', 'URL del Avatar')}</span></label>
                  <input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl w-full text-sm font-medium h-10 border-base-300" value={formInputRegistry.avatar} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, avatar: e.target.value })} placeholder="https://..." />
                  <input type="file" accept="image/*" className="hidden" ref={avatarUploadNodeRef} onChange={parseImageUploadStream} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pt-1">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 font-bold text-[10px] uppercase text-base-content/60">{t('admin.full_name', 'Nombre Completo')}</label>
                  <input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl font-medium text-sm h-10 border-base-300" value={formInputRegistry.full_name} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, full_name: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 font-bold text-[10px] uppercase text-base-content/60">{t('profile.name_alias', 'Alias')}</label>
                  <input type="text" maxLength={15} className="input input-sm input-bordered bg-base-100 rounded-xl font-medium text-sm h-10 border-base-300" value={formInputRegistry.alias} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, alias: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 font-bold text-[10px] uppercase text-base-content/60">{t('admin.email', 'Email')}</label>
                  <input type="email" className="input input-sm input-bordered bg-base-100 rounded-xl font-medium text-sm h-10 border-base-300" value={formInputRegistry.email} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, email: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 font-bold text-[10px] uppercase text-base-content/60">{t('admin.phone', 'Teléfono')}</label>
                  <input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl font-medium text-sm h-10 border-base-300" value={formInputRegistry.phoneNumber} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, phoneNumber: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 font-bold text-[10px] uppercase text-base-content/60">{t('admin.profession', 'Profesión')}</label>
                  <input type="text" className="input input-sm input-bordered bg-base-100 rounded-xl font-medium text-sm h-10 border-base-300" value={formInputRegistry.work} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, work: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="px-1 font-bold text-[10px] uppercase text-base-content/60">{t('admin.personal_location', 'Ubicación predeterminada')}</label>
                  <select 
                    className="select select-sm select-bordered bg-base-100 rounded-xl font-medium text-sm h-10 border-base-300" 
                    value={formInputRegistry.default_category_id} 
                    onChange={e => setFormInputRegistry({...formInputRegistry, default_category_id: e.target.value})}
                  >
                    <option value="">{t('admin.auto_department', '-- Auto (Dept) --')}</option>
                    {categories?.filter(c => {
                      const icon = c.icon || '';
                      const name = (c.name || '').toLowerCase();
                      return icon !== 'BeachAccess' && icon !== 'Sick' && icon !== 'Flight' && 
                             !name.includes('ferie') && !name.includes('malattia') && !name.includes('travel') && !name.includes('trasferta');
                    }).map(c => (
                      <option key={c.id_category} value={c.id_category}>
                        {getDynamicCategoryName(c, i18n.language, t)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5 w-full sm:col-span-2">
                  <label className="px-1"><span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('profile.status', 'Estado')}</span></label>
                  <div className="relative w-full">
                    {dropdownAvailabilityTrigger && <div className="fixed inset-0 z-[100]" onClick={() => setDropdownAvailabilityTrigger(false)}></div>}
                    <button type="button" onClick={() => setDropdownAvailabilityTrigger(!dropdownAvailabilityTrigger)} className="flex items-center justify-between px-4 input-bordered bg-base-100 rounded-xl border border-base-300 w-full h-10 hover:border-primary/50 transition-all cursor-pointer relative z-[10]">
                      <div className="flex items-center gap-3">
                        <span className="text-xl flex items-center justify-center">
                          {evaluateStatusIndicatorType(formInputRegistry.status)}
                        </span>
                        <span className="font-bold text-sm text-base-content">
                          {staticAvailabilityOptions.find(o => o.value === formInputRegistry.status)?.label || formInputRegistry.status}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 text-base-content transition-transform ${dropdownAvailabilityTrigger ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dropdownAvailabilityTrigger && (
                      <div className="absolute top-full left-0 mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-xl w-full z-[110] flex flex-col gap-1 animate-fade-in">
                        {staticAvailabilityOptions.map(opt => (
                          <button 
                            key={opt.value}
                            type="button"
                            className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-all ${
                              formInputRegistry.status === opt.value ? 'bg-primary/10 text-primary' : 'hover:bg-base-200 text-base-content'
                            }`}
                            onClick={() => {
                              setFormInputRegistry({ ...formInputRegistry, status: opt.value });
                              setDropdownAvailabilityTrigger(false);
                            }}
                          >
                            <span className="text-xl flex items-center justify-center">
                              {evaluateStatusIndicatorType(opt.value)}
                            </span>
                            <span className="font-bold text-sm">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 w-full justify-center sm:col-span-2">
                  <label className="label cursor-pointer justify-start gap-3 mt-4">
                    <input type="checkbox" className="toggle toggle-primary" checked={formInputRegistry.can_work_weekends} onChange={e => setFormInputRegistry({ ...formInputRegistry, can_work_weekends: e.target.checked })} />
                    <span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('admin.can_work_weekends', 'Trabaja los fines de semana')}</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full mt-4">
                <label className="px-1 flex items-center gap-1.5">
                  <PasswordIcon fontSize="small" className="text-error/80" />
                  <span className="font-bold text-[10px] uppercase tracking-wider text-error/80">{t('profile.change_password', 'Cambiar Contraseña')}</span>
                </label>
                <input type="password" placeholder={t('profile.password_placeholder', 'Dejar en blanco para mantener')} className="input input-sm input-bordered border-error/30 bg-base-100 rounded-xl focus:border-error focus:outline-none focus:ring-1 focus:ring-error/20 text-sm font-medium h-10 w-full" value={formInputRegistry.password} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, password: e.target.value })} />
              </div>

              <div className="flex flex-col gap-1.5 w-full mt-4">
                <label className="flex justify-between items-center px-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-base-content/60">{t('profile.bio', 'Biografía')}</span>
                  <span className="font-bold text-[10px] text-base-content/40">{formInputRegistry.description.length}/100</span>
                </label>
                <textarea className="textarea textarea-bordered bg-base-100 rounded-2xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none h-24 text-sm leading-relaxed w-full p-4 border-base-300" placeholder={t('profile.bio_placeholder', 'Escribe algo sobre ti...')} maxLength={100} value={formInputRegistry.description} onChange={(e) => setFormInputRegistry({ ...formInputRegistry, description: e.target.value })}></textarea>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 pt-6 border-t border-base-200">
              <button type="button" onClick={() => setTriggersEditMutation(false)} className="btn btn-ghost flex-1 rounded-xl font-bold text-sm h-11 min-h-0 text-base-content/70 hover:bg-base-200 transition-all">{t('profile.cancel', 'Cancelar')}</button>
              <button type="button" onClick={commitProfileConfigurationChanges} className="btn btn-primary flex-1 rounded-xl font-black uppercase tracking-widest text-xs h-11 min-h-0 transition-all">{t('profile.save', 'Guardar')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};