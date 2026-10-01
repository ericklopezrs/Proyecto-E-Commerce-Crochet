import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      access_token: null,
      refresh_token: null,
      usuario: null,

      setSesion: (access_token, refresh_token, usuario) =>
        set({ access_token, refresh_token, usuario }),

      setTokens: (access_token, refresh_token) =>
        set({ access_token, refresh_token }),

      limpiarSesion: () =>
        set({ access_token: null, refresh_token: null, usuario: null }),
    }),
    {
      name: 'peluches-auth',
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        usuario: state.usuario,
      }),
    }
  )
);