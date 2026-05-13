import React, { memo } from 'react';
import dayjs from 'dayjs';
import { type Presence, type Category } from '../types';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add'; 
import CelebrationIcon from '@mui/icons-material/Celebration';
import { getDynamicCategoryName, getCategoryIcon, getCategoryColorClass } from '../utils/categoryUtils';

interface DayCellConfiguration {
  presence?: Presence;
  defaultCategory?: Category | null;
  onAddPresence: (userId: number, targetDate: string) => void;
  userId: number;
  targetDate: string;
  grantsEditPermissions: boolean;
  canWorkWeekends?: boolean;
  holidayName?: string;
}

export const DayCell = memo(({ presence, defaultCategory, onAddPresence, userId, targetDate, grantsEditPermissions: inheritsEditPermissions, canWorkWeekends, holidayName }: DayCellConfiguration) => {
  const { t, i18n } = useTranslation();
  const evaluatedDay = dayjs(targetDate);
  const determinesWeekend = evaluatedDay.isoWeekday() >= 6 && !canWorkWeekends;
  
  if (holidayName) {
    return (
      <div className="w-full h-full min-h-[90px] flex flex-col items-center justify-center p-3 gap-2" title={holidayName}>
        <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center shadow-sm">
          <CelebrationIcon className="text-error" sx={{ fontSize: 26 }} />
        </div>
        <span className="text-[8px] font-black text-center uppercase tracking-wider leading-tight text-error/70 line-clamp-2 max-w-full px-1">
          {holidayName}
        </span>
      </div>
    );
  }

  const validatesEditState = inheritsEditPermissions && !determinesWeekend;
  const validatesActivePresence = presence && presence.categories;
  const computedCategoryPayload = validatesActivePresence ? presence.categories : (determinesWeekend ? null : defaultCategory);
  const evaluatesGhostRender = !validatesActivePresence && !determinesWeekend && defaultCategory;
  const runtimeColorTheme = getCategoryColorClass(computedCategoryPayload);

  return (
    <div
      onClick={validatesEditState ? () => onAddPresence(userId, targetDate) : undefined}
      className={`w-full h-full min-h-[90px] flex flex-col items-center justify-center p-2 group/cell ${validatesEditState ? 'cursor-pointer' : 'cursor-default'} ${computedCategoryPayload ? 'gap-1.5' : ''}`}
      title={computedCategoryPayload ? `${getDynamicCategoryName(computedCategoryPayload, i18n.language, t)}${evaluatesGhostRender ? ` (${t('profile.optional', 'Default')})` : ''}` : undefined}
    >
      {computedCategoryPayload ? (
        <>
          <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border ${
            evaluatesGhostRender
              ? 'bg-base-200/60 border-base-300 opacity-50 grayscale'
              : 'bg-base-200 border-base-300/50 group-hover/cell:scale-105 group-hover/cell:shadow-md group-hover/cell:border-primary/20'
          }`}>
            <span className={`text-2xl md:text-3xl flex items-center justify-center transition-all duration-300 ${
              evaluatesGhostRender ? 'opacity-50' : `${runtimeColorTheme} ${validatesEditState ? 'group-hover/cell:rotate-[8deg]' : ''}`
            }`}>
              {getCategoryIcon(computedCategoryPayload)}
            </span>
          </div>
          <span className={`text-[8px] font-black text-center uppercase tracking-wider leading-tight transition-colors duration-200 max-w-full px-1 ${
            evaluatesGhostRender ? 'text-base-content/30' : 'text-base-content/50 group-hover/cell:text-base-content/80'
          }`}>
            {getDynamicCategoryName(computedCategoryPayload, i18n.language, t)}
          </span>
        </>
      ) : (
        validatesEditState && (
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl border-2 border-dashed border-base-300 flex items-center justify-center text-base-content/20 opacity-0 group-hover/cell:opacity-100 group-hover/cell:border-primary/40 group-hover/cell:text-primary/60 group-hover/cell:scale-110 transition-all duration-300 bg-base-100/50">
            <AddIcon sx={{ fontSize: 18 }} />
          </div>
        )
      )}
    </div>
  );
});