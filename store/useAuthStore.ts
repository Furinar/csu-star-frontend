import {getMyProfile} from "@/api/me";
import {UserProfile} from "@/types/auth";
import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

interface AuthState {

  access_token: string | null;
  refresh_token: string | null;
  user: UserProfile | null;
  _hasHydrated: boolean; // Zustand 内部使用，表示状态是否已从存储中恢复

  setToken: (access_token: string) => void;
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

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
          access_token: null,
          refresh_token: null,
          user: null,
          _hasHydrated: false,

          setToken: (access_token) => set({access_token}),
          setUser: (user) => set({user}),
          login: (access_token, refresh_token, user = null) =>
            set({access_token, refresh_token, user}),
          logout: () => set({access_token: null, refresh_token: null, user: null}),
          setHasHydrated: (v) => set({_hasHydrated: v}),
          refreshProfile: async () => {
            const {access_token} = get();
            if (!access_token) return;
            try {
              const profile = await getMyProfile();
              set({user: profile});
            } catch {
              // silently ignore – caller can handle if needed
            }
          }
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
