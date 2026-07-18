/**
 * BAM! Global Store — Zustand store for auth, user, sound prefs.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, setAuthToken, type User } from "./api";
import { setSoundEnabled } from "./sounds";

interface AppState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Sound
  soundOn: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, display_name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (u: User | null) => void;
  toggleSound: () => void;
  clearError: () => void;
}

export const useBamStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      soundOn: true,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const resp = await api.login({ email, password });
          setAuthToken(resp.access_token);
          set({ user: resp.user, token: resp.access_token, loading: false });
          setSoundEnabled(get().soundOn);
        } catch (e: any) {
          set({ error: e.message || "Login failed", loading: false });
          throw e;
        }
      },

      register: async (email, username, password, display_name) => {
        set({ loading: true, error: null });
        try {
          const resp = await api.register({ email, username, password, display_name });
          setAuthToken(resp.access_token);
          set({ user: resp.user, token: resp.access_token, loading: false });
          setSoundEnabled(get().soundOn);
        } catch (e: any) {
          set({ error: e.message || "Registration failed", loading: false });
          throw e;
        }
      },

      logout: () => {
        setAuthToken(null);
        set({ user: null, token: null });
      },

      refreshUser: async () => {
        if (!get().token) return;
        try {
          const u = await api.me();
          set({ user: u });
        } catch {
          // Token expired
          get().logout();
        }
      },

      setUser: (u) => set({ user: u }),

      toggleSound: () => {
        const next = !get().soundOn;
        set({ soundOn: next });
        setSoundEnabled(next);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "bam-store",
      partialize: (state) => ({
        token: state.token,
        soundOn: state.soundOn,
        // Don't persist user (always re-fetch via refreshUser)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setSoundEnabled(state.soundOn);
          if (state.token) {
            // Set the auth token on module load
            setAuthToken(state.token);
          }
        }
      },
    },
  ),
);
