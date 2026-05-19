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

type DepartmentChartProps = {
  data: { name: string; count: number }[];
  title: string;
};

export function DepartmentChart({ data, title }: DepartmentChartProps) {
  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="name" stroke="#475569" fontSize={12} />
          <YAxis stroke="#475569" fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" fill="#0891B2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
