import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore.js';


const idDelNavegante = () => useAuthStore.getState().usuario?.id ?? 'invitado';

const carritoPorUsuario = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`${name}-${idDelNavegante()}`);
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${name}-${idDelNavegante()}`, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${name}-${idDelNavegante()}`);
  },
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (producto, cantidad = 1) => {
        const { cart } = get();
        const availableStock = producto.stock ?? 10;
        const idx = cart.findIndex((i) => i.producto.id === producto.id);

        if (idx > -1) {
          set({
            cart: cart.map((item, i) =>
              i === idx
                ? { ...item, cantidad: Math.min(item.cantidad + cantidad, availableStock) }
                : item
            )
          });
        } else {
          set({ cart: [...cart, { producto, cantidad: Math.min(cantidad, availableStock) }] });
        }
      },

      removeFromCart: (id) =>
        set({ cart: get().cart.filter((i) => i.producto.id !== id) }),

      clearCart: () => set({ cart: [] }),

      getTotal: () =>
        get().cart.reduce((t, i) => t + i.producto.precio * i.cantidad, 0),
    }),
    {
      name: 'peluches-cart',
      storage: createJSONStorage(() => carritoPorUsuario),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);