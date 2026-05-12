import { create } from 'zustand';
import { type User, type Category } from '../types';

import { API_URL } from '../config';

interface AppState {
  token: string | null;
  currentUser: User | null;
  users: User[];
  categories: Category[];
  interactionModalContext: { id_user: number; date: string } | null;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  fetchGlobalData: () => Promise<void>;
  updateUser: (mutatedDataPayload: any) => Promise<void>;
  setInteractionModalContext: (context: { id_user: number; date: string } | null) => void;
  commitPresenceEntry: (categoryId: number) => Promise<void>;
  commitBulkPresences: (presences: {id_user: number, date: string, id_category: number}[]) => Promise<void>;
  obliteratePresenceEntry: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  token: localStorage.getItem('fae_token'),
  currentUser: JSON.parse(localStorage.getItem('fae_user') || 'null'),
  users: [],
  categories: [],
  interactionModalContext: null,

  setAuth: (token, user) => {
    if (token && user) {
      localStorage.setItem('fae_token', token);
      localStorage.setItem('fae_user', JSON.stringify(user));
    } else {
      localStorage.clear();
    }
    set({ token, currentUser: user });
  },

  logout: () => {
    localStorage.clear();
    set({ token: null, currentUser: null, users: [], categories: [], interactionModalContext: null });
    window.history.replaceState(null, '', '/');
  },

  updateCurrentUser: (updates) => set((state) => {
    if (!state.currentUser) return state;
    const updated = { ...state.currentUser, ...updates };
    localStorage.setItem('fae_user', JSON.stringify(updated));
    return { currentUser: updated };
  }),

  fetchGlobalData: async () => {
    const { token, logout } = get();
    if (!token) return;
    try {
      const authorizationHeaders = { 'Authorization': `Bearer ${token}` };
      const [usersResponseStream, categoriesResponseStream] = await Promise.all([
        fetch(`${API_URL}/users`, { headers: authorizationHeaders }),
        fetch(`${API_URL}/categories`, { headers: authorizationHeaders })
      ]);

      if (usersResponseStream.status === 401 || usersResponseStream.status === 403) {
        logout();
        return;
      }

      const parsedUsers = await usersResponseStream.json();
      const parsedCategories = await categoriesResponseStream.json();

      set({
        users: parsedUsers.map((u: any) => ({
          ...u,
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.alias || u.full_name)}&background=random`
        })),
        categories: parsedCategories
      });
    } catch (networkException) {}
  },

  updateUser: async (mutatedDataPayload) => {
    const { token, fetchGlobalData, currentUser, updateCurrentUser } = get();
    if (!token) return;
    const requestPayload: any = { ...mutatedDataPayload };
    if (!requestPayload.password || requestPayload.password.trim() === '') {
      delete requestPayload.password;
    }
    try {
      const networkResponse = await fetch(`${API_URL}/users/${mutatedDataPayload.id_user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestPayload)
      });
      if (networkResponse.ok) {
        await fetchGlobalData();
        if (currentUser?.id_user === mutatedDataPayload.id_user) {
          updateCurrentUser(requestPayload);
        }
      }
    } catch (networkException) {}
  },

  setInteractionModalContext: (context) => set({ interactionModalContext: context }),

  commitPresenceEntry: async (categoryId) => {
    const { token, interactionModalContext, fetchGlobalData } = get();
    if (!interactionModalContext || !token) return;
    try {
      await fetch(`${API_URL}/presences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id_user: interactionModalContext.id_user, date: interactionModalContext.date, id_category: categoryId }),
      });
      set({ interactionModalContext: null });
      await fetchGlobalData();
    } catch (networkException) {}
  },

  commitBulkPresences: async (presences) => {
    const { token, fetchGlobalData } = get();
    if (!token) return;
    try {
      await fetch(`${API_URL}/presences/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ presences }),
      });
      await fetchGlobalData();
    } catch (networkException) {}
  },

  obliteratePresenceEntry: async () => {
    const { token, interactionModalContext, fetchGlobalData } = get();
    if (!interactionModalContext || !token) return;
    try {
      await fetch(`${API_URL}/presences`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id_user: interactionModalContext.id_user, date: interactionModalContext.date })
      });
      set({ interactionModalContext: null });
      await fetchGlobalData();
    } catch (networkException) {}
  }
}));