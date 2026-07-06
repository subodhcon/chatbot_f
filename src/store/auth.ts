import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clearTokens, setTokens, fetchWithAuth } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isRestored: boolean;
  
  // Actions
  login: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isRestored: false,

      login: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        clearTokens();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      updateUser: (user) => {
        set({ user });
      },

      restoreSession: async () => {
        // Prevent duplicate calls
        if (get().isRestored) return;

        if (typeof window === "undefined") {
          set({ isRestored: true });
          return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isRestored: true,
          });
          return;
        }

        try {
          // Fetch current user from backend to verify and restore profile
          const response = await fetchWithAuth<UserProfile>("/auth/me");
          
          if (response.success && response.data) {
            set({
              user: response.data,
              accessToken: token,
              isAuthenticated: true,
              isRestored: true,
            });
          } else {
            // Token is invalid/expired
            clearTokens();
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isRestored: true,
            });
          }
        } catch {
          // Network issue or similar - keep whatever state we have or clear
          set({ isRestored: true });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist user and accessToken, ignore isRestored to force session verification on reload
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
