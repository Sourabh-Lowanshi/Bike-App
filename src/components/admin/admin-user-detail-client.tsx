"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { IBike } from "@/types";

interface UserDetail {
  user: { _id: string; name: string; email: string; role: "user" | "admin" };
  bikes: IBike[];
  summary: {
    fuelEntryCount: number;
    totalFuelSpend: number;
    tripCount: number;
    maintenanceCount: number;
    totalMaintenanceSpend: number;
  };
}

async function fetchUserDetail(id: string): Promise<UserDetail> {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}

async function updateUser(id: string, payload: { name?: string; role?: string }) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

async function updateBike(bikeId: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/admin/bikes/${bikeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update bike");
  return res.json();
}

async function deleteBike(bikeId: string) {
  const res = await fetch(`/api/admin/bikes/${bikeId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete bike");
  return res.json();
}

export function AdminUserDetailClient({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => fetchUserDetail(userId),
  });

  const { register, handleSubmit } = useForm<{ name: string; role: string }>({
    values: data ? { name: data.user.name, role: data.user.role } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; role?: string }) => updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bikeMutation = useMutation({
    mutationFn: ({ bikeId, payload }: { bikeId: string; payload: Record<string, unknown> }) =>
      updateBike(bikeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      toast.success("Bike updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteBikeMutation = useMutation({
    mutationFn: deleteBike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      toast.success("Bike deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading || !data) return <p className="text-sm text-text-muted">Loading…</p>;

  const { summary } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <form
          onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              {...register("role")}
              className="h-11 w-full rounded-xl border border-border-glass bg-white/[0.03] px-3 text-sm text-text-primary outline-none focus:border-pearl-2/60"
            >
              <option value="user" className="bg-bg">user</option>
              <option value="admin" className="bg-bg">admin</option>
            </select>
          </div>
          <Button type="submit" variant="pearl" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            Save
          </Button>
        </form>
        <p className="mt-3 text-xs text-text-muted">{data.user.email}</p>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardTitle>Fuel Entries</CardTitle>
          <CardValue>{summary.fuelEntryCount}</CardValue>
        </Card>
        <Card>
          <CardTitle>Fuel Spend</CardTitle>
          <CardValue>{formatCurrency(summary.totalFuelSpend)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Trips</CardTitle>
          <CardValue>{summary.tripCount}</CardValue>
        </Card>
        <Card>
          <CardTitle>Maintenance Spend</CardTitle>
          <CardValue>{formatCurrency(summary.totalMaintenanceSpend)}</CardValue>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bikes</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {data.bikes.length === 0 && <p className="text-sm text-text-muted">No bikes yet.</p>}
          {data.bikes.map((bike) => (
            <div key={bike._id} className="rounded-xl border border-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">{bike.bikeName}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10"
                  onClick={() => {
                    if (confirm(`Delete ${bike.bikeName}? This removes the bike record only.`)) {
                      deleteBikeMutation.mutate(bike._id);
                    }
                  }}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <EditableField
                  label="Odometer"
                  defaultValue={bike.currentOdometer}
                  onSave={(v) => bikeMutation.mutate({ bikeId: bike._id, payload: { currentOdometer: Number(v) } })}
                />
                <EditableField
                  label="Tank (L)"
                  defaultValue={bike.tankCapacity}
                  onSave={(v) => bikeMutation.mutate({ bikeId: bike._id, payload: { tankCapacity: Number(v) } })}
                />
                <EditableField
                  label="Plate No."
                  defaultValue={bike.registrationNumber ?? ""}
                  onSave={(v) => bikeMutation.mutate({ bikeId: bike._id, payload: { registrationNumber: v } })}
                />
                <EditableField
                  label="Nickname"
                  defaultValue={bike.bikeName}
                  onSave={(v) => bikeMutation.mutate({ bikeId: bike._id, payload: { bikeName: v } })}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EditableField({
  label,
  defaultValue,
  onSave,
}: {
  label: string;
  defaultValue: string | number;
  onSave: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        defaultValue={defaultValue}
        onBlur={(e) => {
          if (e.target.value !== String(defaultValue)) onSave(e.target.value);
        }}
      />
    </div>
  );
}
