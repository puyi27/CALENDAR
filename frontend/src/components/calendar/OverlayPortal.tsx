import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { getCategoryIcon } from '../../utils/categoryUtils';

interface OverlayPortalProps {
  overlayContextProperties: {
    date: string;
    catName: string;
    categoryData: any;
    userName: string;
    isDefault?: boolean;
    isHoliday?: boolean;
  } | null;
  setOverlayContextProperties: (val: any) => void;
}

export const OverlayPortal = ({ overlayContextProperties, setOverlayContextProperties }: OverlayPortalProps) => {
  const { t } = useTranslation();

  if (!overlayContextProperties) return null;

  return createPortal(
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
            getCategoryIcon(overlayContextProperties.categoryData?.icon)
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
  );
};
