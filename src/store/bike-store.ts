import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActiveBikeState {
  activeBikeId: string | null;
  setActiveBikeId: (id: string | null) => void;
}

export const useActiveBikeStore = create<ActiveBikeState>()(
  persist(
    (set) => ({
      activeBikeId: null,
      setActiveBikeId: (id) => set({ activeBikeId: id }),
    }),
    { name: "blackpearl-active-bike" }
  )
);
