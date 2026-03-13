import { UserProfile } from "@/types/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {

  access_token: string | null;
  refresh_token: string | null;
  user: UserProfile | null;
  _hasHydrated: boolean; // Zustand 内部使用，表示状态是否已从存储中恢复

  setTokens: (access_token: string) => void;
  setUser: (user: UserProfile) => void;
  login: (access_token: string, refresh_token: string, user: UserProfile) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      refresh_token: null,
      user: null,
      _hasHydrated: false,

      //set函数更新状态
      setTokens: (access_token) => set({ access_token }),
      setUser: (user) => set({ user }),
      login: (access_token, refresh_token, user) => set({ access_token, refresh_token, user }),
      logout: () => set({ access_token: null, refresh_token: null, user: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v })
    }),

    //持久化配置
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
)