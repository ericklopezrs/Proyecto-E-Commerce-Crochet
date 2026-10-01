import { create } from 'zustand';

export const useUiStore = create((set) => ({
  searchTerm: '',
  selectedCategoria: 'TODAS',
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedCategoria: (id) => set({ selectedCategoria: id }),
}));