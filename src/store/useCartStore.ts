import { create } from "zustand";

type CartState = {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementBy: (delta: number) => void;
};

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: Math.max(0, count) }),
  incrementBy: (delta) =>
    set((state) => ({ itemCount: Math.max(0, state.itemCount + delta) }))
}));
