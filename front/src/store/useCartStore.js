import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: [],
  
  addToCart: (producto, cantidad = 1) => {
    const { cart } = get();
    const itemIndex = cart.findIndex((item) => item.producto.id === producto.id);
    const availableStock = producto.stock ?? 10; // Fallback a 10 por si viene nulo

    if (itemIndex > -1) {
      // Si el producto ya existe en el carrito, sumamos validando el stock
      const newCart = [...cart];
      newCart[itemIndex].cantidad = Math.min(newCart[itemIndex].cantidad + cantidad, availableStock);
      set({ cart: newCart });
    } else {
      // Si es un producto nuevo, lo agregamos validando también que no rebase el stock
      set({ cart: [...cart, { producto, cantidad: Math.min(cantidad, availableStock) }] });
    }
  },
  
  removeFromCart: (id) => {
    set({ cart: get().cart.filter((item) => item.producto.id !== id) });
  },

  increaseQty: (id) => {
    const { cart } = get();
    const newCart = cart.map((item) => {
      if (item.producto.id !== id) return item;
      const availableStock = item.producto.stock ?? 10;
      return { ...item, cantidad: Math.min(item.cantidad + 1, availableStock) };
    });
    set({ cart: newCart });
  },

  decreaseQty: (id) => {
    const { cart } = get();
    const newCart = cart
      .map((item) => {
        if (item.producto.id !== id) return item;
        return { ...item, cantidad: item.cantidad - 1 };
      })
      // Si la cantidad llega a 0, el producto se elimina del carrito
      .filter((item) => item.cantidad > 0);
    set({ cart: newCart });
  },

  clearCart: () => set({ cart: [] }),
  
  getTotal: () => get().cart.reduce((total, item) => total + item.producto.precio * item.cantidad, 0),
}));