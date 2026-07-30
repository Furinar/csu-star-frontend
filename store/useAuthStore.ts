import { getMyProfile } from "@/api/me";
import { UserProfile } from "@/types/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const AUTH_STORAGE_KEY = "auth-storage";

interface AuthState {
  access_token: string | null;
  refresh_token: string | null;
  user: UserProfile | null;
  _hasHydrated: boolean;

  setToken: (access_token: string) => void;
  setTokens: (access_token: string, refresh_token?: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  login: (
    access_token: string,
    refresh_token: string | null,
    user?: UserProfile | null,
  ) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
  refreshProfile: () => Promise<void>;
}

type PersistedAuthSlice = {
  access_token: string | null;
  refresh_token: string | null;
  user: UserProfile | null;
};

/**
 * Synchronously read zustand-persist payload from localStorage.
 * Must NOT be used for store initial state (would SSR/CSR mismatch).
 * Apply in useLayoutEffect after hydration instead.
 */
export function readPersistedAuthSlice(): PersistedAuthSlice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Partial<PersistedAuthSlice> };
    const state = parsed?.state;
    if (!state || typeof state !== "object") return null;

    return {
      access_token:
        typeof state.access_token === "string" && state.access_token
          ? state.access_token
          : null,
      refresh_token:
        typeof state.refresh_token === "string" && state.refresh_token
          ? state.refresh_token
          : null,
      user:
        state.user && typeof state.user === "object" ? state.user : null,
    };
  } catch {
    return null;
  }
}

/**
 * Apply localStorage auth into the store synchronously (no await).
 * Call from useLayoutEffect so server HTML and first client render stay
 * identical, then paint with real auth before the browser flushes.
 */
export function applyPersistedAuthSync(): void {
  const persisted = readPersistedAuthSlice();
  if (persisted) {
    useAuthStore.setState({
      access_token: persisted.access_token,
      refresh_token: persisted.refresh_token,
      user: persisted.user,
      _hasHydrated: true,
    });
  } else {
    useAuthStore.setState({ _hasHydrated: true });
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Always start empty so SSR HTML matches the client's first render.
      access_token: null,
      refresh_token: null,
      user: null,
      _hasHydrated: false,

      setToken: (access_token) => set({ access_token }),
      setTokens: (access_token, refresh_token) =>
        set((state) => ({
          access_token,
          refresh_token:
            typeof refresh_token === "undefined"
              ? state.refresh_token
              : refresh_token,
        })),
      setUser: (user) => set({ user }),
      login: (access_token, refresh_token, user = null) =>
        set({ access_token, refresh_token, user }),
      logout: () =>
        set({ access_token: null, refresh_token: null, user: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      refreshProfile: async () => {
        const { access_token } = get();
        if (!access_token) return;

        try {
          const profile = await getMyProfile();
          set({ user: profile });
        } catch {
          // Silently ignore; callers can decide whether to surface errors.
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true);
        } else {
          useAuthStore.setState({ _hasHydrated: true });
        }
      },
    },
  ),
);
