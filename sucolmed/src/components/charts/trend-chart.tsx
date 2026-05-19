"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrendChartProps = {
  data: { date: string; count: number }[];
  title: string;
};

export function TrendChart({ data, title }: TrendChartProps) {
  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" stroke="#475569" fontSize={12} />
          <YAxis stroke="#475569" fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#0891B2"
            strokeWidth={2}
            dot={{ fill: "#0891B2" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
