"use client";

import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Plus, Trash2, Coffee, Cigarette, Milk, Bus, UtensilsCrossed, Sun, Moon, Receipt } from "lucide-react";
import { dailyExpenseSchema, type DailyExpenseInput } from "@/lib/validations";
import { DAILY_EXPENSE_CATEGORIES, type DailyExpenseCategory } from "@/lib/constants";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type DailyExpenseFormValues = z.input<typeof dailyExpenseSchema>;

interface DailyExpenseRecord extends DailyExpenseInput {
  _id: string;
}

const CATEGORY_ICONS: Record<DailyExpenseCategory, React.ElementType> = {
  Breakfast: Sun,
  Lunch: UtensilsCrossed,
  Dinner: Moon,
  Tea: Coffee,
  Milk: Milk,
  Cigarette: Cigarette,
  "Bus/Train": Bus,
  Other: Receipt,
};

async function fetchExpenses(): Promise<{ expenses: DailyExpenseRecord[] }> {
  const res = await fetch("/api/daily-expenses");
  if (!res.ok) throw new Error("Failed to load expenses");
  return res.json();
}

async function createExpense(payload: DailyExpenseInput) {
  const res = await fetch("/api/daily-expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save expense");
  return res.json();
}

async function deleteExpense(id: string) {
  const res = await fetch(`/api/daily-expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete expense");
  return res.json();
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function DailyExpensesClient() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["daily-expenses"], queryFn: fetchExpenses });
  const amountRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DailyExpenseFormValues, unknown, DailyExpenseInput>({
    resolver: zodResolver(dailyExpenseSchema),
    defaultValues: { date: new Date(), category: "Tea" },
  });

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
      toast.success("Expense logged");
      reset({ date: new Date(), category: "Tea" });
    },
    onError: () => toast.error("Failed to save expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
      toast.success("Removed");
    },
  });

  const { todayTotal, monthTotal, byCategory } = useMemo(() => {
    const expenses = data?.expenses ?? [];
    const now = new Date();
    let todayTotal = 0;
    let monthTotal = 0;
    const byCategory = new Map<string, number>();

    for (const e of expenses) {
      const d = new Date(e.date);
      if (isSameDay(d, now)) todayTotal += e.amount;
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        monthTotal += e.amount;
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
      }
    }
    return { todayTotal, monthTotal, byCategory };
  }, [data]);

  const quickAdd = (category: DailyExpenseCategory) => {
    setValue("category", category);
    amountRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Today</CardTitle>
          <CardValue>{formatCurrency(todayTotal)}</CardValue>
        </Card>
        <Card>
          <CardTitle>This Month</CardTitle>
          <CardValue>{formatCurrency(monthTotal)}</CardValue>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardTitle>Top Category</CardTitle>
          <CardValue className="text-base">
            {Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}
          </CardValue>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Add</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {DAILY_EXPENSE_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return (
              <Button key={c} type="button" variant="glass" size="sm" onClick={() => quickAdd(c)}>
                <Icon size={13} /> {c}
              </Button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  {...register("category")}
                  className="h-11 w-full rounded-xl border border-border-glass bg-white/[0.03] px-3 text-sm text-text-primary outline-none focus:border-pearl-2/60"
                >
                  {DAILY_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-bg">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                {(() => {
                  const amountField = register("amount");
                  return (
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="20"
                      name={amountField.name}
                      onChange={amountField.onChange}
                      onBlur={amountField.onBlur}
                      ref={(el) => {
                        amountField.ref(el);
                        amountRef.current = el;
                      }}
                    />
                  );
                })()}
                {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} {...register("date")} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Optional…" {...register("notes")} />
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
            {(!data || data.expenses.length === 0) && (
              <p className="py-4 text-sm text-text-muted">No expenses logged yet.</p>
            )}
            {data?.expenses.map((e) => {
              const Icon = CATEGORY_ICONS[e.category];
              return (
                <div key={e._id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-text-primary">{e.category}</p>
                      <p className="text-xs text-text-muted">{formatDate(e.date as unknown as string)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{formatCurrency(e.amount)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                      onClick={() => deleteMutation.mutate(e._id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
