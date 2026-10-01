import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);