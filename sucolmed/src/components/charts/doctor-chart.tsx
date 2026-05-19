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

type DoctorChartProps = {
  data: { name: string; count: number }[];
  title: string;
};

export function DoctorChart({ data, title }: DoctorChartProps) {
  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis type="number" stroke="#475569" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} width={80} />
          <Tooltip />
          <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
