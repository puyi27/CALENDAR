import { type Category } from '../types';
import HomeIcon from '@mui/icons-material/Home';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import SickIcon from '@mui/icons-material/Sick';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';

export const ALLOWED_ICON_NAMES = ['Home', 'BeachAccess', 'Sick', 'Business', 'Work'];

export const getCategoryIcon = (catOrIcon: any) => {
  if (!catOrIcon) return <BusinessIcon fontSize="inherit" />;
  let iconName = typeof catOrIcon === 'string' ? catOrIcon : catOrIcon?.icon;
  const catName = typeof catOrIcon === 'string' ? '' : (catOrIcon?.name || '');

  if (!iconName || iconName === 'Business') {
     const name = catName.toLowerCase();
     if (name.includes('casa') || name.includes('smart') || name.includes('teletrabajo')) iconName = 'Home';
     else if (name.includes('ferie') || name.includes('libre') || name.includes('vacac')) iconName = 'BeachAccess';
     else if (name.includes('malattia') || name.includes('enferm') || name.includes('sick') || name.includes('baja') || name.includes('malo')) iconName = 'Sick';
     else if (name.includes('travel') || name.includes('viaje') || name.includes('trasferta')) iconName = 'Work';
     else iconName = 'Business';
  }

  switch (iconName) {
    case 'Home': return <HomeIcon fontSize="inherit" />;
    case 'BeachAccess': return <BeachAccessIcon fontSize="inherit" />;
    case 'Sick': return <SickIcon fontSize="inherit" />;
    case 'Work': return <WorkIcon fontSize="inherit" />;
    default: return <BusinessIcon fontSize="inherit" />;
  }
};

export const getDynamicCategoryName = (category: any, lang: string, t: any) => {
  if (!category) return '';
  if (lang === 'en' && category.name_en) return category.name_en;
  if (lang === 'es' && category.name_es) return category.name_es;
  
  const translationKey = `categories_list.${category.name}`;
  const translated = t(translationKey);
  
  return translated !== translationKey ? translated : category.name;
};

export const getCategoryColorClass = (category: any) => {
  if (!category) return 'text-primary/80';
  const icon = typeof category === 'string' ? category : category.icon;
  const name = typeof category === 'string' ? '' : (category.name || '').toLowerCase();
  
  if (icon === 'Sick' || name.includes('enfermedad') || name.includes('malattia') || name.includes('sick') || name.includes('baja') || name.includes('malo')) {
    return 'text-error';
  }
  if (icon === 'Home' || icon === 'HomeWork' || name.includes('smart') || name.includes('teletrabajo') || name.includes('casa')) {
    return 'text-success';
  }
  if (icon === 'BeachAccess' || name.includes('vacaciones') || name.includes('ferie') || name.includes('libre')) {
    return 'text-[#15aabf]';
  }
  if (icon === 'Work' || icon === 'Flight' || name.includes('terreno') || name.includes('on-site')) {
    return 'text-[#fab005]';
  }
  if (icon === 'Business' || icon === 'Domain' || name.includes('kilometro rosso') || name.includes('albino')) {
    return 'text-[#4dabf7]';
  }
  return 'text-primary/80';
};