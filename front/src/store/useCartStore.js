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

const mismoId = (a, b) => String(a) === String(b);

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (producto, cantidad = 1) => {
        const { cart } = get();
        const availableStock = producto.stock ?? 10;
        const idx = cart.findIndex((i) => mismoId(i.producto.id, producto.id));

        if (idx > -1) {
          set({
            cart: cart.map((item, i) =>
              i === idx
                ? { ...item, cantidad: Math.min(item.cantidad + cantidad, availableStock) }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { producto, cantidad: Math.min(cantidad, availableStock) }] });
        }
      },

      updateQuantity: (productoId, nuevaCantidad) =>
        set({
          cart: get().cart.map((item) => {
            if (!mismoId(item.producto.id, productoId)) return item;
            const stock = item.producto.stock ?? 10;
            const cantidad = Math.max(1, Math.min(nuevaCantidad, stock));
            return { ...item, cantidad };
          }),
        }),

      removeFromCart: (id) =>
        set({ cart: get().cart.filter((i) => !mismoId(i.producto.id, id)) }),

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