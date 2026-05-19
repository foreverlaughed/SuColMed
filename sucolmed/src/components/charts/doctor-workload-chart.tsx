"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DoctorWorkloadChartProps = {
  data: {
    name: string;
    appointments: number;
    records: number;
  }[];
};

export function DoctorWorkloadChart({ data }: DoctorWorkloadChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="appointments" name="预约数" fill="hsl(187, 84%, 43%)" />
        <Bar dataKey="records" name="病历数" fill="hsl(187, 72%, 54%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
