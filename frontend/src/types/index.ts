export interface Category {
  id_category: number;
  name: string;
  name_en?: string;
  name_es?: string;
  icon: string;
}

export interface Presence {
  id_presence: number;
  date: string;
  categories?: Category;
}

export interface User {
  id_user: number;
  full_name: string;
  alias: string;
  email: string;
  work?: string;
  role?: string;
  department?: string;
  avatar?: string;
  description?: string;
  status?: string;
  theme?: string;
  language?: string;
  phoneNumber?: string;
  presences?: Presence[];
  default_category_id?: number | null;
  default_category?: Category | null;
  can_work_weekends?: boolean; 
}