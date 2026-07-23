"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, PieChartIcon, Loader2, Activity } from "lucide-react";

interface TrafficDay {
  day: string;
  success: number;
  failed: number;
}

interface StatusItem {
  name: string;
  value: number;
  color: string;
}

interface TopKey {
  name: string;
  requests: number;
  env: string;
}

interface AnalyticsData {
  trafficTimeline: TrafficDay[];
  statusDistribution: StatusItem[];
  topKeys: TopKey[];
  avgLatencyMs: number;
  totalRequests: number;
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (!cancelled && res.ok) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const totalRequests = data.totalRequests || data.trafficTimeline.reduce((s, d) => s + d.success + d.failed, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      {/* Daily Requests Bar Chart */}
      <div className="glass rounded-xl p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">Traffic Timeline (7 days)</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {totalRequests.toLocaleString()} total
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.trafficTimeline}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.14 0 0)",
                border: "1px solid oklch(1 0 0 / 10%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="success" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} name="Success" />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution + Latency */}
      <div className="glass rounded-xl p-5 flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Key Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={data.statusDistribution.filter((s) => s.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {data.statusDistribution.filter((s) => s.value > 0).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "oklch(0.14 0 0)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={6} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Avg Latency: <span className="text-emerald-400 font-mono-key font-medium">{data.avgLatencyMs}ms</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            Total Keys: <span className="text-emerald-400 font-mono-key font-medium">
              {data.statusDistribution.reduce((s, d) => s + d.value, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Active Keys */}
      <div className="glass rounded-xl p-5 lg:col-span-3">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">Top Active Keys by Request Volume</h3>
        </div>
        {data.topKeys.length === 0 ? (
          <div className="h-[80px] flex items-center justify-center text-sm text-muted-foreground">
            No key activity yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.topKeys.map((key, idx) => {
              const maxReq = Math.max(...data.topKeys.map((k) => k.requests), 1);
              const pct = (key.requests / maxReq) * 100;
              const envColor =
                key.env === "production" ? "bg-rose-500"
                : key.env === "staging" ? "bg-amber-500"
                : "bg-sky-500";
              return (
                <div key={key.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right font-mono-key">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{key.name}</span>
                      <span className="text-xs text-muted-foreground font-mono-key">{key.requests.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${envColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
