import { create } from "zustand";
import {
  authService,
  type User,
  type LoginCredentials,
} from "@/services/auth.service";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => void;
  login: (credentials: LoginCredentials) => Promise<User>;
  qrLogin: (qrToken: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;

  // Derived
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    const token = authService.getToken();
    const savedUser = authService.getCurrentUser();

    if (token && savedUser) {
      set({ isAuthenticated: true, user: savedUser, isLoading: false });
    } else {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  login: async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const user = response.data.user;
    set({ isAuthenticated: true, user });
    return user;
  },

  qrLogin: async (qrToken: string) => {
    const response = await authService.qrLogin(qrToken);
    const user = response.data.user;
    set({ isAuthenticated: true, user });
    return user;
  },

  logout: async () => {
    await authService.logout();
    set({ isAuthenticated: false, user: null });
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  isAdmin: () => {
    return get().user?.role === "ADMIN";
  },
}));
