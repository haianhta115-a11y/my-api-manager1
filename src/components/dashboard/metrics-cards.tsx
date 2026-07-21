"use client";

import { motion } from "framer-motion";
import {
  KeyRound,
  CheckCircle2,
  Activity,
  Gauge,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export interface MetricsData {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  totalRequests: number;
  usagePercent: number;
}

interface MetricsCardsProps {
  metrics: MetricsData | null;
  isLoading: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="glass rounded-xl p-5 space-y-3"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Keys",
      value: metrics.totalKeys,
      icon: KeyRound,
      accent: "text-emerald-400",
      bgIcon: "bg-emerald-500/10",
    },
    {
      label: "Active Keys",
      value: metrics.activeKeys,
      icon: CheckCircle2,
      accent: "text-emerald-400",
      bgIcon: "bg-emerald-500/10",
    },
    {
      label: "Requests (24h)",
      value: metrics.totalRequests.toLocaleString(),
      icon: Activity,
      accent: "text-sky-400",
      bgIcon: "bg-sky-500/10",
    },
    {
      label: "Rate Usage",
      value: `${metrics.usagePercent}%`,
      icon: Gauge,
      accent:
        metrics.usagePercent > 80
          ? "text-amber-400"
          : "text-emerald-400",
      bgIcon:
        metrics.usagePercent > 80
          ? "bg-amber-500/10"
          : "bg-emerald-500/10",
      progress: metrics.usagePercent,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="glass rounded-xl p-5 hover:border-emerald-500/20 transition-colors duration-300 group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.label}
            </span>
            <div
              className={`w-8 h-8 rounded-lg ${card.bgIcon} flex items-center justify-center`}
            >
              <card.icon className={`w-4 h-4 ${card.accent}`} />
            </div>
          </div>
          <p
            className={`text-2xl font-bold tracking-tight ${card.accent} font-mono-key`}
          >
            {card.value}
          </p>
          {card.progress !== undefined && (
            <div className="mt-3">
              <Progress
                value={card.progress}
                className="h-1.5 bg-white/5 [&>div]:bg-emerald-500"
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}