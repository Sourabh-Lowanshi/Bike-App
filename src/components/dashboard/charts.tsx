"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const PEARL = ["#7c9cff", "#b98cff", "#7ce3d8", "#fb7185", "#fbbf24", "#4ade80", "#f97316", "#38bdf8"];

const tooltipStyle = {
  background: "#0d0d13",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#f4f4f7",
};

export function FuelExpenseChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Fuel Expense by Month</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c9cff" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#7c9cff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="month" stroke="#6b6b76" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b6b76" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="amount" stroke="#7c9cff" fill="url(#fuelGrad)" strokeWidth={2} name="Fuel ₹" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function MileageTrendChart({ data }: { data: { month: string; mileage: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mileage Trend (km/l)</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="month" stroke="#6b6b76" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b6b76" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="mileage" stroke="#7ce3d8" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function ExpensePieChart({ data }: { data: { category: string; amount: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={PEARL[i % PEARL.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function FuelVsMaintenanceBar({ fuel, maintenance }: { fuel: number; maintenance: number }) {
  const data = [{ name: "Lifetime", fuel, maintenance }];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel vs Maintenance</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" stroke="#6b6b76" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" stroke="#6b6b76" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="fuel" fill="#7c9cff" radius={[6, 6, 6, 6]} name="Fuel ₹" />
          <Bar dataKey="maintenance" fill="#b98cff" radius={[6, 6, 6, 6]} name="Maintenance ₹" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
