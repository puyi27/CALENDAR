import React from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { DayCell } from '../DayCell';
import { getDynamicCategoryName, getCategoryColorClass, getCategoryIcon } from '../../utils/categoryUtils';
import { type User } from '../../types';

interface MobileCalendarProps {
  extendedMobileDateCollection: dayjs.Dayjs[];
  activeMobileViewDate: string;
  setActiveMobileViewDate: (val: string) => void;
  setActiveDateFilter: (val: string) => void;
  executeScrollToTargetDate: (val: string) => void;
  holidays: any[];
  headerCounts: any;
  formattedUserDataset: any[];
  currentUser: User | null;
  onAddPresence: (userId: number, date: string) => void;
  setOverlayContextProperties: (val: any) => void;
  scrollableMobileContainerRef: React.RefObject<HTMLDivElement | null>;
  resolveStatusIndicatorIcon: (status?: string) => React.ReactNode;
  mapStatusToTranslation: (status?: string) => string;
}

export const MobileCalendar = ({
  extendedMobileDateCollection,
  activeMobileViewDate,
  setActiveMobileViewDate,
  setActiveDateFilter,
  executeScrollToTargetDate,
  holidays,
  headerCounts,
  formattedUserDataset,
  currentUser,
  onAddPresence,
  setOverlayContextProperties,
  scrollableMobileContainerRef,
  resolveStatusIndicatorIcon,
  mapStatusToTranslation
}: MobileCalendarProps) => {
  const { t, i18n } = useTranslation();
  const triggerNavigation = useNavigate();

  return (
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
          {headerCounts[activeMobileViewDate].map((item: any) => (
            <div key={item.category.id_category}
              className="flex items-center gap-1.5 bg-base-100 border border-base-300 rounded-xl px-3 py-1.5 shadow-xs"
              title={getDynamicCategoryName(item.category, i18n.language, t)}
            >
              <span className={`text-base flex items-center justify-center ${getCategoryColorClass(item.category)}`}>{getCategoryIcon(item.category.icon)}</span>
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
                  <div className="absolute -bottom-1 -right-1 bg-base-100 rounded-full border border-base-200 shadow-sm p-[2px] z-10 flex items-center justify-center" title={mapStatusToTranslation(profileEntity.status)}>
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
  );
};
