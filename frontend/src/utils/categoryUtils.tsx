import HomeIcon from '@mui/icons-material/Home'
import BeachAccessIcon from '@mui/icons-material/BeachAccess'
import SickIcon from '@mui/icons-material/Sick'
import BusinessIcon from '@mui/icons-material/Business'
import WorkIcon from '@mui/icons-material/Work'

/**
 * The set of MUI icon names that are officially supported by the platform.
 * Any category with an `icon` value outside this list will fall back to `'Business'`.
 */
export const ALLOWED_ICON_NAMES = ['Home', 'BeachAccess', 'Sick', 'Business', 'Work']

/**
 * Resolves and renders the MUI icon component for a given category or icon name string.
 *
 * The function applies a two-step resolution strategy:
 * 1. Uses `catOrIcon.icon` directly when it matches a supported icon name.
 * 2. Falls back to keyword matching on the category `name` (multilingual) when the
 *    icon field is missing or defaults to `'Business'`.
 *
 * @param catOrIcon - Either a full category object with `icon` and `name` fields,
 *                    or a plain icon name string.
 * @returns A React element representing the resolved MUI icon, sized via `fontSize="inherit"`.
 *
 * @example
 * ```tsx
 * <span>{getCategoryIcon(category)}</span>
 * <span>{getCategoryIcon('Home')}</span>
 * ```
 */
export const getCategoryIcon = (catOrIcon: any) => {
  if (!catOrIcon) return <BusinessIcon fontSize="inherit" />
  let iconName = typeof catOrIcon === 'string' ? catOrIcon : catOrIcon?.icon
  const catName = typeof catOrIcon === 'string' ? '' : (catOrIcon?.name || '')

  if (!iconName || iconName === 'Business') {
    const name = catName.toLowerCase()
    if (name.includes('casa') || name.includes('smart') || name.includes('teletrabajo')) { iconName = 'Home' }
    else if (name.includes('ferie') || name.includes('libre') || name.includes('vacac')) { iconName = 'BeachAccess' }
    else if (name.includes('malattia') || name.includes('enferm') || name.includes('sick') || name.includes('baja') || name.includes('malo')) { iconName = 'Sick' }
    else if (name.includes('travel') || name.includes('viaje') || name.includes('trasferta')) { iconName = 'Work' }
    else { iconName = 'Business' }
  }

  switch (iconName) {
    case 'Home': return <HomeIcon fontSize="inherit" />
    case 'BeachAccess': return <BeachAccessIcon fontSize="inherit" />
    case 'Sick': return <SickIcon fontSize="inherit" />
    case 'Work': return <WorkIcon fontSize="inherit" />
    default: return <BusinessIcon fontSize="inherit" />
  }
}

/**
 * Returns the localised display name for a category based on the active language.
 *
 * Resolution order:
 * 1. `category.name_en` if `lang === 'en'`
 * 2. `category.name_es` if `lang === 'es'`
 * 3. i18next translation key `categories_list.<name>`
 * 4. Raw `category.name` as the final fallback
 *
 * @param category - The category object to resolve the name for.
 * @param lang - Active i18next language code (e.g. `'en'`, `'es'`, `'it'`).
 * @param t - The i18next translation function from `useTranslation()`.
 * @returns The localised category name string.
 */
export const getDynamicCategoryName = (category: any, lang: string, t: any) => {
  if (!category) return ''
  if (lang === 'en' && category.name_en) return category.name_en
  if (lang === 'es' && category.name_es) return category.name_es

  const translationKey = `categories_list.${category.name}`
  const translated = t(translationKey)

  return translated !== translationKey ? translated : category.name
}

/**
 * Maps a category to a Tailwind CSS text-color class for consistent color coding
 * across the calendar grid, profile page, and Teams notifications.
 *
 * Color mapping:
 * - **Red** (`text-error`) → Sick / Medical leave
 * - **Green** (`text-success`) → Smart Working / Remote
 * - **Cyan** (`text-[#15aabf]`) → Vacation / Beach access
 * - **Amber** (`text-[#fab005]`) → Travel / On-site
 * - **Blue** (`text-[#4dabf7]`) → Main office locations
 * - **Default** (`text-primary/80`) → Any unrecognised category
 *
 * @param category - A category object or icon name string.
 * @returns A Tailwind CSS class string for the text color.
 */
export const getCategoryColorClass = (category: any) => {
  if (!category) return 'text-primary/80'
  const icon = typeof category === 'string' ? category : category.icon
  const name = typeof category === 'string' ? '' : (category.name || '').toLowerCase()

  if (icon === 'Sick' || name.includes('enfermedad') || name.includes('malattia') || name.includes('sick') || name.includes('baja') || name.includes('malo')) {
    return 'text-error'
  }
  if (icon === 'Home' || icon === 'HomeWork' || name.includes('smart') || name.includes('teletrabajo') || name.includes('casa')) {
    return 'text-success'
  }
  if (icon === 'BeachAccess' || name.includes('vacaciones') || name.includes('ferie') || name.includes('libre')) {
    return 'text-[#15aabf]'
  }
  if (icon === 'Work' || icon === 'Flight' || name.includes('terreno') || name.includes('on-site')) {
    return 'text-[#fab005]'
  }
  if (icon === 'Business' || icon === 'Domain' || name.includes('kilometro rosso') || name.includes('albino')) {
    return 'text-[#4dabf7]'
  }
  return 'text-primary/80'
}