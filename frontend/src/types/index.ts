/**
 * Represents a presence category (e.g. "Office", "Smart Working", "Vacation").
 * Categories are defined by administrators and drive both the calendar display and Teams notifications.
 */
export interface Category {
  /** Unique numeric identifier for the category. */
  id_category: number
  /** Display name in the default locale (Italian). */
  name: string
  /** Optional English translation of the category name. */
  name_en?: string
  /** Optional Spanish translation of the category name. */
  name_es?: string
  /**
   * MUI icon name used to render the category icon.
   * Supported values: `'Home'`, `'BeachAccess'`, `'Sick'`, `'Work'`, `'Business'`.
   */
  icon: string
}

/**
 * A single presence record linking a user to a specific date and category.
 */
export interface Presence {
  /** Unique identifier for this presence record. */
  id_presence: number
  /** ISO 8601 date string (e.g. `'2026-05-14'`). */
  date: string
  /** The resolved category for this presence entry. */
  categories?: Category
}

/**
 * Represents a platform user with all profile, permission and preference fields.
 */
export interface User {
  /** Unique numeric identifier for the user. */
  id_user: number
  /** Full legal name (e.g. `'John Doe'`). */
  full_name: string
  /** Short display name shown in the calendar grid (max 15 chars). */
  alias: string
  /** Corporate email address used for authentication. */
  email: string
  /** Job title or professional role (e.g. `'Software Engineer'`). */
  work?: string
  /**
   * Access role. Controls UI visibility and API authorization.
   * Accepted values: `'user'`, `'admin'`, `'superadmin'`.
   */
  role?: string
  /** Department the user belongs to (maps to a `departments` row). */
  department?: string
  /** URL or base64-encoded data URI for the user's avatar image. */
  avatar?: string
  /** Short biography or status message (max 100 chars). */
  description?: string
  /**
   * Real-time availability status displayed in the calendar.
   * Accepted values: `'Disponibile'`, `'Occupato'`, `'Smart Working'`, `'In Ferie'`.
   */
  status?: string
  /** DaisyUI theme identifier (e.g. `'light'`, `'dark'`). */
  theme?: string
  /** i18next language code (e.g. `'es'`, `'en'`, `'it'`). */
  language?: string
  /** Contact phone number. */
  phoneNumber?: string
  /** All presence records associated with this user. */
  presences?: Presence[]
  /**
   * Overrides the department-level default category for this specific user.
   * If `null`, the department default is used.
   */
  default_category_id?: number | null
  /** Resolved default category object (populated by the backend JOIN query). */
  default_category?: Category | null
  /**
   * When `true`, the user's calendar grid shows Saturday and Sunday as workable days.
   * @default false
   */
  can_work_weekends?: boolean
}