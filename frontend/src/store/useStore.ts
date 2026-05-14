import { create } from 'zustand';
import { type User, type Category } from '../types';

import { API_URL } from '../config';

/**
 * Global application state shape managed by Zustand.
 * Persists authentication credentials in `localStorage` under the keys
 * `fae_token` and `fae_user`.
 */
interface AppState {
  /** JWT access token returned by `POST /api/login`. `null` when unauthenticated. */
  token: string | null

  /** The currently authenticated user profile. `null` when unauthenticated. */
  currentUser: User | null

  /**
   * Full list of all platform users, including their presence records.
   * Populated by {@link fetchGlobalData}.
   */
  users: User[]

  /**
   * All available presence categories fetched from `GET /api/categories`.
   * Populated by {@link fetchGlobalData}.
   */
  categories: Category[]

  /**
   * Context object for the presence interaction modal.
   * When non-null, the modal is open for the specified user and date.
   */
  interactionModalContext: { id_user: number; date: string } | null

  /**
   * Persists the JWT token and user profile to `localStorage` and updates the store.
   * Passing `null` for both arguments clears all persisted data (logout).
   *
   * @param token - JWT access token string, or `null` to clear.
   * @param user - Authenticated user object, or `null` to clear.
   */
  setAuth: (token: string | null, user: User | null) => void

  /**
   * Clears all authentication state from memory and `localStorage`,
   * then redirects the browser to `/` without a history entry.
   */
  logout: () => void

  /**
   * Applies a partial update to the current user profile both in memory and in `localStorage`.
   * Does not trigger a server request — use after a successful API call.
   *
   * @param updates - Partial `User` object with only the fields to overwrite.
   */
  updateCurrentUser: (updates: Partial<User>) => void

  /**
   * Fetches the complete users and categories lists from the API in parallel.
   * Auto-generates avatar URLs for users without one.
   * Calls {@link logout} automatically if the server returns 401 or 403.
   */
  fetchGlobalData: () => Promise<void>

  /**
   * Sends a `PUT /api/users/:id` request to persist user profile changes.
   * Omits the password field from the payload when left blank.
   * Refreshes global data and updates `currentUser` if the edited user is the active session.
   *
   * @param mutatedDataPayload - Full user object with the updated fields merged in.
   */
  updateUser: (mutatedDataPayload: any) => Promise<void>

  /**
   * Sets or clears the interaction modal context.
   * Setting a value opens the presence picker modal for that user/date combination.
   *
   * @param context - `{ id_user, date }` to open the modal, or `null` to close it.
   */
  setInteractionModalContext: (context: { id_user: number; date: string } | null) => void

  /**
   * Creates or updates a presence entry via `POST /api/presences`.
   * Reads the current `interactionModalContext` for the target user and date.
   * Clears the modal context and refreshes global data on success.
   *
   * @param categoryId - The `id_category` to assign to the presence.
   */
  commitPresenceEntry: (categoryId: number) => Promise<void>

  /**
   * Batch-creates or updates multiple presence entries via `POST /api/presences/bulk`.
   * Used by the "Fill Month" feature in the profile page.
   *
   * @param presences - Array of `{ id_user, date, id_category }` records.
   */
  commitBulkPresences: (presences: { id_user: number; date: string; id_category: number }[]) => Promise<void>

  /**
   * Deletes the presence entry defined by the current `interactionModalContext`
   * via `DELETE /api/presences`.
   * Clears the modal context and refreshes global data on success.
   */
  obliteratePresenceEntry: () => Promise<void>
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