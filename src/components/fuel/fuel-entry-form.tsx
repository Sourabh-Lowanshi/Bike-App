"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import { fuelEntrySchema, type FuelEntryInput } from "@/lib/validations";

type FuelEntryFormValues = z.input<typeof fuelEntrySchema>;
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBikes } from "@/hooks/use-bikes";
import { useEffect } from "react";

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

async function createFuelEntry(payload: FuelEntryInput) {
  const res = await fetch("/api/fuel-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : "Failed to save fuel entry");
  }
  return res.json();
}

export function FuelEntryForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [locating, setLocating] = useState(false);
  const [stationName, setStationName] = useState<string | null>(null);
  const { bikes, activeBikeId } = useBikes();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FuelEntryFormValues, unknown, FuelEntryInput>({
    resolver: zodResolver(fuelEntrySchema),
    defaultValues: {
      date: new Date(),
    },
  });

  useEffect(() => {
    if (activeBikeId) setValue("bikeId", activeBikeId);
  }, [activeBikeId, setValue]);

  const mutation = useMutation({
    mutationFn: createFuelEntry,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success(
        data.mileage ? `Saved! Mileage: ${data.mileage} km/l` : "Fuel entry saved"
      );
      router.push("/dashboard");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setValue("latitude", latitude);
        setValue("longitude", longitude);
        const name = await reverseGeocode(latitude, longitude);
        if (name) {
          setStationName(name);
          setValue("fuelStationName", name);
        }
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location — check permissions");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const lat = watch("latitude");
  const lng = watch("longitude");

  return (
    <Card className="mx-auto max-w-xl">
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        {bikes.length > 1 ? (
          <div>
            <Label htmlFor="bikeId">Bike</Label>
            <select
              id="bikeId"
              {...register("bikeId")}
              className="h-11 w-full rounded-xl border border-border-glass bg-white/[0.03] px-3 text-sm text-text-primary outline-none focus:border-pearl-2/60"
            >
              {bikes.map((b) => (
                <option key={b._id} value={b._id} className="bg-bg">
                  {b.bikeName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" {...register("bikeId")} />
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              {...register("date")}
            />
            {errors.date && <p className="mt-1 text-xs text-danger">{errors.date.message}</p>}
          </div>
          <div>
            <Label htmlFor="odometerReading">Current Odometer (km)</Label>
            <Input id="odometerReading" type="number" step="0.1" placeholder="12450" {...register("odometerReading")} />
            {errors.odometerReading && (
              <p className="mt-1 text-xs text-danger">{errors.odometerReading.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount Paid (₹)</Label>
            <Input id="amount" type="number" step="0.01" placeholder="300" {...register("amount")} />
            {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="liters">Liters</Label>
            <Input id="liters" type="number" step="0.01" placeholder="6" {...register("liters")} />
            {errors.liters && <p className="mt-1 text-xs text-danger">{errors.liters.message}</p>}
          </div>
        </div>

        <div>
          <Label>Location</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="glass" size="sm" onClick={detectLocation} disabled={locating}>
              {locating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
              {locating ? "Locating…" : "Detect current location"}
            </Button>
            {lat != null && lng != null && (
              <span className="text-xs text-text-muted">
                {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
              </span>
            )}
          </div>
          {stationName && <p className="mt-2 text-xs text-text-secondary">{stationName}</p>}
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Optional notes…" {...register("notes")} />
        </div>

        <Button type="submit" variant="pearl" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
          Save Fuel Entry
        </Button>
      </form>
    </Card>
  );
}
