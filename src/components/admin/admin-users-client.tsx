"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  bikeCount: number;
  totalFuelSpend: number;
}

async function fetchUsers(): Promise<{ users: AdminUser[] }> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

async function deleteUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export function AdminUsersClient() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User and all their data removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-sm text-text-muted">Loading…</p>;

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs text-text-muted">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Role</th>
            <th className="pb-3 font-medium">Bikes</th>
            <th className="pb-3 font-medium">Fuel Spend</th>
            <th className="pb-3 font-medium">Joined</th>
            <th className="pb-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {data?.users.map((u) => (
            <tr key={u._id} className="border-b border-white/5 last:border-0">
              <td className="py-3">
                <Link href={`/admin/users/${u._id}`} className="text-text-primary hover:text-pearl-2">
                  {u.name}
                </Link>
              </td>
              <td className="py-3 text-text-secondary">{u.email}</td>
              <td className="py-3">
                <span
                  className={
                    u.role === "admin"
                      ? "rounded-full bg-pearl-2/15 px-2 py-0.5 text-xs text-pearl-2"
                      : "text-text-muted"
                  }
                >
                  {u.role}
                </span>
              </td>
              <td className="py-3 text-text-secondary">{u.bikeCount}</td>
              <td className="py-3 text-text-secondary">{formatCurrency(u.totalFuelSpend)}</td>
              <td className="py-3 text-text-muted">{formatDate(u.createdAt)}</td>
              <td className="py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10"
                  onClick={() => {
                    if (confirm(`Delete ${u.name} and all their data? This can't be undone.`)) {
                      deleteMutation.mutate(u._id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
