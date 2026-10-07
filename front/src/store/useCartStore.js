import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore.js';

// ¿Quién navega? Cada quien guarda su carrito en SU llave
const idDelNavegante = () => useAuthStore.getState().usuario?.id ?? 'invitado';

// Storage "listo": redirige cada lectura/escritura a la llave del
// usuario que esté conectado EN ESE MOMENTO
const carritoPorUsuario = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null; // en el server no hay localStorage
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

      updateQuantity: (id, cantidad) =>
        set({
          cart: get().cart.map((i) => {
            if (i.producto.id !== id) return i;
            const max = Math.max(1, i.producto.stock ?? 10);
            return { ...i, cantidad: Math.min(Math.max(1, cantidad), max) };
          }),
        }),

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