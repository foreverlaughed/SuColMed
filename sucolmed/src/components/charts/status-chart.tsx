"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type StatusChartProps = {
  data: { status: string; count: number }[];
  title: string;
};

const COLORS = ["#F59E0B", "#0891B2", "#EF4444", "#22C55E"];

const statusLabels: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  cancelled: "已取消",
  completed: "已完成",
};

export function StatusChart({ data, title }: StatusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    status: statusLabels[d.status] || d.status,
  }));

  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="count"
            nameKey="status"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
