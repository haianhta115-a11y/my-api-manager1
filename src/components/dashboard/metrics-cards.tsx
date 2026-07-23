"use client";

import { motion } from "framer-motion";
import {
  KeyRound,
  CheckCircle2,
  Activity,
  Gauge,
  Sparkles,
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
  hidden: { opacity: 0, y: 25, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
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
      label: "Total Credentials",
      value: metrics.totalKeys,
      icon: KeyRound,
      accent: "text-emerald-400",
      bgIcon: "bg-emerald-500/15 border border-emerald-500/30",
      glowClass: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Active Keys",
      value: metrics.activeKeys,
      icon: CheckCircle2,
      accent: "text-emerald-400",
      bgIcon: "bg-emerald-500/15 border border-emerald-500/30",
      glowClass: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Requests (24h)",
      value: metrics.totalRequests.toLocaleString(),
      icon: Activity,
      accent: "text-sky-400",
      bgIcon: "bg-sky-500/15 border border-sky-500/30",
      glowClass: "group-hover:shadow-[0_0_25px_rgba(14,165,233,0.25)]",
    },
    {
      label: "Rate Usage Limit",
      value: `${metrics.usagePercent}%`,
      icon: Gauge,
      accent:
        metrics.usagePercent > 80
          ? "text-amber-400"
          : "text-purple-400",
      bgIcon:
        metrics.usagePercent > 80
          ? "bg-amber-500/15 border border-amber-500/30"
          : "bg-purple-500/15 border border-purple-500/30",
      glowClass: "group-hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]",
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
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`glass rounded-xl p-5 border border-white/5 transition-all duration-300 group cursor-default relative overflow-hidden ${card.glowClass}`}
        >
          {/* Subtle Cyber Accent Line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {card.label}
            </span>
            <div
              className={`w-9 h-9 rounded-lg ${card.bgIcon} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
            >
              <card.icon className={`w-4.5 h-4.5 ${card.accent}`} />
            </div>
          </div>

          <p
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.accent} font-mono`}
          >
            {card.value}
          </p>

          {card.progress !== undefined ? (
            <div className="mt-3">
              <Progress
                value={card.progress}
                className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-emerald-400"
              />
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Real-time live metrics</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}