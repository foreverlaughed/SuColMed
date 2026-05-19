"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AppointmentChartProps = {
  data: {
    date: string;
    count: number;
  }[];
};

export function AppointmentChart({ data }: AppointmentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(187, 84%, 43%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
