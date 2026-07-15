"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { z } from "zod";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/validations";

type MaintenanceFormValues = z.input<typeof maintenanceSchema>;
import { MAINTENANCE_TYPES } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useBikes } from "@/hooks/use-bikes";
import { useEffect } from "react";

interface MaintenanceRecord extends MaintenanceInput {
  _id: string;
}

async function fetchRecords(bikeId: string | null): Promise<{ records: MaintenanceRecord[] }> {
  const res = await fetch(bikeId ? `/api/maintenance?bikeId=${bikeId}` : "/api/maintenance");
  if (!res.ok) throw new Error("Failed to load maintenance records");
  return res.json();
}

async function createRecord(payload: MaintenanceInput) {
  const res = await fetch("/api/maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save record");
  return res.json();
}

export function MaintenanceClient() {
  const queryClient = useQueryClient();
  const { bikes, activeBikeId } = useBikes();
  const { data } = useQuery({
    queryKey: ["maintenance", activeBikeId],
    queryFn: () => fetchRecords(activeBikeId),
    enabled: !!activeBikeId,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormValues, unknown, MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { date: new Date(), category: "Service" },
  });

  useEffect(() => {
    if (activeBikeId) setValue("bikeId", activeBikeId);
  }, [activeBikeId, setValue]);

  const mutation = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Expense saved");
      reset({ date: new Date(), category: "Service", bikeId: activeBikeId ?? undefined });
    },
    onError: () => toast.error("Failed to save expense"),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
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
          )}          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Full service" {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="h-11 w-full rounded-xl border border-border-glass bg-white/[0.03] px-3 text-sm text-text-primary outline-none focus:border-pearl-2/60"
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-bg">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input id="odometer" type="number" step="0.1" {...register("odometer")} />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} {...register("date")} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
          <Button type="submit" variant="pearl" className="w-full" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Add Expense
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <div className="max-h-[520px] divide-y divide-white/5 overflow-y-auto">
          {(!data || data.records.length === 0) && (
            <p className="py-4 text-sm text-text-muted">No maintenance records yet.</p>
          )}
          {data?.records.map((r) => (
            <div key={r._id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-text-primary">{r.title}</p>
                <p className="text-xs text-text-muted">
                  {r.category} · {formatDate(r.date)}
                </p>
              </div>
              <p className="font-medium text-text-primary">{formatCurrency(r.amount)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
