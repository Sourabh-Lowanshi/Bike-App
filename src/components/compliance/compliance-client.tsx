"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBikes } from "@/hooks/use-bikes";
import { formatCurrency } from "@/lib/utils";
import type { IChallanCache, IInsuranceCache } from "@/types";

async function fetchChallan(bikeId: string, refresh = false): Promise<{ challan?: IChallanCache; error?: string; notConfigured?: boolean }> {
  const res = await fetch(`/api/bikes/${bikeId}/challan${refresh ? "?refresh=true" : ""}`);
  return res.json();
}

async function fetchInsurance(bikeId: string, refresh = false): Promise<{ insurance?: IInsuranceCache; error?: string; notConfigured?: boolean }> {
  const res = await fetch(`/api/bikes/${bikeId}/insurance${refresh ? "?refresh=true" : ""}`);
  return res.json();
}

export function ComplianceClient() {
  const { activeBike, activeBikeId } = useBikes();
  const queryClient = useQueryClient();

  const challanQuery = useQuery({
    queryKey: ["challan", activeBikeId],
    queryFn: () => fetchChallan(activeBikeId as string),
    enabled: !!activeBikeId,
  });

  const insuranceQuery = useQuery({
    queryKey: ["insurance", activeBikeId],
    queryFn: () => fetchInsurance(activeBikeId as string),
    enabled: !!activeBikeId,
  });

  const refreshChallan = useMutation({
    mutationFn: () => fetchChallan(activeBikeId as string, true),
    onSuccess: (data) => {
      if (data.error) toast.error(data.error);
      else toast.success("Challan status refreshed");
      queryClient.setQueryData(["challan", activeBikeId], data);
    },
  });

  const refreshInsurance = useMutation({
    mutationFn: () => fetchInsurance(activeBikeId as string, true),
    onSuccess: (data) => {
      if (data.error) toast.error(data.error);
      else toast.success("Insurance status refreshed");
      queryClient.setQueryData(["insurance", activeBikeId], data);
    },
  });

  if (!activeBike) {
    return <p className="text-sm text-text-muted">Add a bike in the Garage first.</p>;
  }

  if (!activeBike.registrationNumber) {
    return (
      <Card className="text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-400" size={22} />
        <p className="text-sm text-text-secondary">
          Add {activeBike.bikeName}&apos;s registration number in the Garage to enable challan and
          insurance checks.
        </p>
      </Card>
    );
  }

  const challanData = challanQuery.data?.challan;
  const insuranceData = insuranceQuery.data?.insurance;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Challan Status</CardTitle>
          <Button
            variant="glass"
            size="sm"
            onClick={() => refreshChallan.mutate()}
            disabled={refreshChallan.isPending || challanQuery.isLoading}
          >
            {refreshChallan.isPending ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
          </Button>
        </CardHeader>

        {challanQuery.isLoading ? (
          <p className="text-sm text-text-muted">Checking…</p>
        ) : challanQuery.data?.notConfigured ? (
          <NotConfiguredNote message={challanQuery.data.error} />
        ) : challanQuery.data?.error ? (
          <p className="text-sm text-danger">{challanQuery.data.error}</p>
        ) : challanData ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {challanData.pendingCount > 0 ? (
                <ShieldAlert className="text-danger" size={18} />
              ) : (
                <ShieldCheck className="text-success" size={18} />
              )}
              <span className="text-sm text-text-primary">
                {challanData.pendingCount > 0
                  ? `${challanData.pendingCount} pending challan(s) — ${formatCurrency(challanData.totalAmount)}`
                  : "No pending challans"}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Last checked {new Date(challanData.checkedAt).toLocaleString("en-IN")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No data yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Status</CardTitle>
          <Button
            variant="glass"
            size="sm"
            onClick={() => refreshInsurance.mutate()}
            disabled={refreshInsurance.isPending || insuranceQuery.isLoading}
          >
            {refreshInsurance.isPending ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
          </Button>
        </CardHeader>

        {insuranceQuery.isLoading ? (
          <p className="text-sm text-text-muted">Checking…</p>
        ) : insuranceQuery.data?.notConfigured ? (
          <NotConfiguredNote message={insuranceQuery.data.error} />
        ) : insuranceQuery.data?.error ? (
          <p className="text-sm text-danger">{insuranceQuery.data.error}</p>
        ) : insuranceData ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {insuranceData.valid ? (
                <ShieldCheck className="text-success" size={18} />
              ) : (
                <ShieldAlert className="text-danger" size={18} />
              )}
              <span className="text-sm text-text-primary">
                {insuranceData.valid ? "Active" : "Expired / not found"}
                {insuranceData.expiryDate ? ` · until ${insuranceData.expiryDate}` : ""}
              </span>
            </div>
            {insuranceData.provider && (
              <p className="text-xs text-text-muted">{insuranceData.provider}</p>
            )}
            <p className="text-xs text-text-muted">
              Last checked {new Date(insuranceData.checkedAt).toLocaleString("en-IN")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No data yet.</p>
        )}
      </Card>
    </div>
  );
}

function NotConfiguredNote({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
      {message ?? "Not configured yet."} See the README for setup steps.
    </div>
  );
}
