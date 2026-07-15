"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Star, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { bikeSchema, type BikeInput } from "@/lib/validations";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useBikes } from "@/hooks/use-bikes";
import { useActiveBikeStore } from "@/store/bike-store";
import { cn } from "@/lib/utils";

type BikeFormValues = z.input<typeof bikeSchema>;

async function createBike(payload: BikeInput) {
  const res = await fetch("/api/bikes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add bike");
  return res.json();
}

async function deleteBike(id: string) {
  const res = await fetch(`/api/bikes/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete bike");
  }
  return res.json();
}

async function setDefaultBike(id: string) {
  const res = await fetch(`/api/bikes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setDefault: true }),
  });
  if (!res.ok) throw new Error("Failed to set default bike");
  return res.json();
}

export function GarageClient() {
  const { bikes, activeBikeId, setActiveBikeId } = useBikes();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BikeFormValues, unknown, BikeInput>({
    resolver: zodResolver(bikeSchema),
    defaultValues: {
      bikeName: "",
      bikeModel: "",
      brand: "",
      color: "",
      tankCapacity: 12,
      fuelType: "Petrol",
      currentOdometer: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: createBike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      toast.success("Bike added");
      reset();
      setShowForm(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      toast.success("Bike removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultBike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bikes"] });
      toast.success("Default bike updated");
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {bikes.map((bike) => (
          <Card
            key={bike._id}
            className={cn(
              "cursor-pointer",
              activeBikeId === bike._id && "border-pearl-2/60"
            )}
            onClick={() => setActiveBikeId(bike._id)}
          >
            <CardHeader>
              <CardTitle className="text-base text-text-primary">{bike.bikeName}</CardTitle>
              {bike.isDefault && <Star size={14} className="text-pearl-2" fill="currentColor" />}
            </CardHeader>
            <p className="text-sm text-text-secondary">
              {bike.brand} {bike.bikeModel} · {bike.color}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {bike.registrationNumber || "No plate number set"} · {bike.currentOdometer} km
            </p>

            <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Link href="/compliance">
                <Button variant="glass" size="sm">
                  <ShieldCheck size={13} /> Compliance
                </Button>
              </Link>
              {!bike.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => defaultMutation.mutate(bike._id)}
                  disabled={defaultMutation.isPending}
                >
                  Set Default
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(bike._id)}
                disabled={deleteMutation.isPending}
                className="ml-auto text-danger hover:bg-danger/10"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {!showForm ? (
        <Button variant="glass" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Bike
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add a Bike</CardTitle>
          </CardHeader>
          <form
            onSubmit={handleSubmit((d) => createMutation.mutate(d))}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="bikeName">Nickname</Label>
              <Input id="bikeName" placeholder="BlackPearl" {...register("bikeName")} />
              {errors.bikeName && <p className="mt-1 text-xs text-danger">{errors.bikeName.message}</p>}
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" placeholder="TVS" {...register("brand")} />
            </div>
            <div>
              <Label htmlFor="bikeModel">Model</Label>
              <Input id="bikeModel" placeholder="Apache RTR 160 4V" {...register("bikeModel")} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="Black" {...register("color")} />
            </div>
            <div>
              <Label htmlFor="tankCapacity">Tank Capacity (L)</Label>
              <Input id="tankCapacity" type="number" step="0.1" {...register("tankCapacity")} />
            </div>
            <div>
              <Label htmlFor="currentOdometer">Current Odometer (km)</Label>
              <Input id="currentOdometer" type="number" step="0.1" {...register("currentOdometer")} />
            </div>
            <div>
              <Label htmlFor="fuelType">Fuel Type</Label>
              <select
                id="fuelType"
                {...register("fuelType")}
                className="h-11 w-full rounded-xl border border-border-glass bg-white/[0.03] px-3 text-sm text-text-primary outline-none focus:border-pearl-2/60"
              >
                <option value="Petrol" className="bg-bg">Petrol</option>
                <option value="Diesel" className="bg-bg">Diesel</option>
                <option value="Electric" className="bg-bg">Electric</option>
              </select>
            </div>
            <div>
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input id="registrationNumber" placeholder="MP09AB1234" {...register("registrationNumber")} />
              <p className="mt-1 text-xs text-text-muted">Needed for challan/insurance checks.</p>
            </div>

            <div className="col-span-full flex gap-2">
              <Button type="submit" variant="pearl" disabled={isSubmitting || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                Save Bike
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
