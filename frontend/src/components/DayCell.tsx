import React, { memo } from 'react';
import dayjs from 'dayjs';
import { type Presence, type Category } from '../types';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add'; 
import CelebrationIcon from '@mui/icons-material/Celebration';
import { getDynamicCategoryName, getCategoryIcon } from '../utils/categoryUtils';

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
      <div className="w-full h-full min-h-[90px] flex flex-col items-center justify-center transition-all p-2 bg-error/5 border border-error/10 rounded-[1rem] cursor-not-allowed" title={holidayName}>
        <CelebrationIcon fontSize="large" className="opacity-80 mb-1 text-error" />
        <span className="text-[9px] font-extrabold text-center uppercase tracking-widest leading-tight text-error/80 line-clamp-2">
          {holidayName}
        </span>
      </div>
    );
  }

  const validatesEditState = inheritsEditPermissions && !determinesWeekend;
  const validatesActivePresence = presence && presence.categories;
  const computedCategoryPayload = validatesActivePresence ? presence.categories : (determinesWeekend ? null : defaultCategory);
  const evaluatesGhostRender = !validatesActivePresence && !determinesWeekend && defaultCategory;

  let runtimeColorTheme = 'text-primary/80';
  if (computedCategoryPayload) {
    const icon = computedCategoryPayload.icon || '';
    if (icon === 'Home' || icon === 'HomeWork') {
      runtimeColorTheme = 'text-[#40c057]';
    } else if (icon === 'Business' || icon === 'Domain') {
      runtimeColorTheme = 'text-[#4dabf7]';
    } else if (icon === 'BeachAccess') {
      runtimeColorTheme = 'text-[#15aabf]';
    } else if (icon === 'Sick') {
      runtimeColorTheme = 'text-[#fa5252]';
    } else if (icon === 'Flight' || icon === 'Work') {
      runtimeColorTheme = 'text-[#fab005]';
    }
  }

  return (
    <div
      onClick={validatesEditState ? () => onAddPresence(userId, targetDate) : undefined}
      className={`w-full h-full min-h-[90px] flex flex-col items-center justify-center transition-all p-2 group/cell ${validatesEditState ? 'cursor-pointer hover:bg-primary/[0.03]' : 'cursor-default'} ${computedCategoryPayload ? 'gap-1' : ''}`}
      title={computedCategoryPayload ? `${t('daycell.status', 'Status')}: ${getDynamicCategoryName(computedCategoryPayload, i18n.language, t)}${evaluatesGhostRender ? ` (${t('profile.optional', 'Default')})` : ''}` : undefined}
    >
      {computedCategoryPayload ? (
        <>
          <span className={`text-3xl md:text-4xl flex items-center justify-center transition-all duration-300 ease-in-out ${validatesEditState && !evaluatesGhostRender ? 'group-hover/cell:scale-110 hover:!scale-115 hover:rotate-[5deg]' : ''} ${evaluatesGhostRender ? 'opacity-40 grayscale grayscale-[50%]' : runtimeColorTheme} ${evaluatesGhostRender && validatesEditState ? 'group-hover/cell:opacity-60' : ''}`}>
            {getCategoryIcon(computedCategoryPayload)}
          </span>
          <span className={`text-[9px] font-semibold text-center uppercase tracking-widest leading-tight transition-colors duration-200 mt-1 ${evaluatesGhostRender ? 'text-base-content/40' : 'text-base-content/60'} ${validatesEditState && !evaluatesGhostRender ? 'group-hover/cell:text-base-content' : ''}`}>
            {getDynamicCategoryName(computedCategoryPayload, i18n.language, t)}
          </span>
        </>
      ) : (
        validatesEditState && (
          <div className="w-8 h-8 md:w-9 md:h-9 m-auto rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center text-base-content/30 opacity-100 lg:opacity-0 lg:group-hover/cell:opacity-100 lg:group-hover/cell:border-primary lg:group-hover/cell:text-primary transition-all duration-300 bg-base-100 shadow-sm hover:scale-110 hover:shadow-md">
            <AddIcon fontSize="small" />
          </div>
        )
      )}
    </div>
  );
});