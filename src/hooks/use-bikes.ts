"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveBikeStore } from "@/store/bike-store";
import type { IBike } from "@/types";

async function fetchBikes(): Promise<{ bikes: IBike[] }> {
  const res = await fetch("/api/bikes");
  if (!res.ok) throw new Error("Failed to load bikes");
  return res.json();
}

export function useBikes() {
  const { data, isLoading, ...rest } = useQuery({ queryKey: ["bikes"], queryFn: fetchBikes });
  const { activeBikeId, setActiveBikeId } = useActiveBikeStore();

  const bikes = data?.bikes ?? [];

  useEffect(() => {
    if (isLoading || bikes.length === 0) return;
    const stillExists = bikes.some((b) => b._id === activeBikeId);
    if (!activeBikeId || !stillExists) {
      const fallback = bikes.find((b) => b.isDefault) ?? bikes[0];
      setActiveBikeId(fallback._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, bikes.length, activeBikeId]);

  const activeBike = bikes.find((b) => b._id === activeBikeId) ?? null;

  return { bikes, activeBike, activeBikeId, setActiveBikeId, isLoading, ...rest };
}
