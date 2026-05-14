import React from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { DayCell } from '../DayCell';
import { getDynamicCategoryName, getCategoryColorClass, getCategoryIcon } from '../../utils/categoryUtils';
import { type User } from '../../types';

interface DesktopCalendarProps {
  localizedWeekCollection: dayjs.Dayjs[];
  activeDateFilter: string;
  setActiveDateFilter: (val: string) => void;
  holidays: any[];
  headerCounts: any;
  formattedUserDataset: any[];
  currentUser: User | null;
  onAddPresence: (userId: number, date: string) => void;
  setOverlayContextProperties: (val: any) => void;
  sortingConfiguration: any;
  triggerSortingExecution: (metric: 'alias' | 'work' | 'department') => void;
  resolveStatusIndicatorIcon: (status?: string) => React.ReactNode;
  mapStatusToTranslation: (status?: string) => string;
}

export const DesktopCalendar = ({
  localizedWeekCollection,
  activeDateFilter,
  setActiveDateFilter,
  holidays,
  headerCounts,
  formattedUserDataset,
  currentUser,
  onAddPresence,
  setOverlayContextProperties,
  sortingConfiguration,
  triggerSortingExecution,
  resolveStatusIndicatorIcon,
  mapStatusToTranslation
}: DesktopCalendarProps) => {
  const { t, i18n } = useTranslation();
  const triggerNavigation = useNavigate();

  return (
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
                          {activeCategories.map((item: any) => (
                            <span
                              key={item.category.id_category}
                              className="flex items-center gap-0.5 bg-base-200/80 border border-base-300/60 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-base-content/60"
                              title={getDynamicCategoryName(item.category, i18n.language, t)}
                            >
                              <span className={`text-[11px] ${getCategoryColorClass(item.category)}`}>{getCategoryIcon(item.category.icon)}</span>
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
  );
};
