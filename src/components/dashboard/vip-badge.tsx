"use client";

import { motion } from "framer-motion";
import { Crown, Shield, Sparkles } from "lucide-react";

interface VipBadgeProps {
  role?: string;
  email?: string | null;
}

export function VipBadge({ role = "user", email }: VipBadgeProps) {
  const isVip = role === "admin" || role === "vip";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300
        ${isVip
          ? "bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
          : "bg-white/5 border-white/10"
        }
      `}>
        {isVip ? (
          <>
            <div className="relative">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full blur-sm"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              VIP Admin
            </span>
            <Sparkles className="w-3 h-3 text-amber-400/70" />
          </>
        ) : (
          <>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {role}
            </span>
          </>
        )}
      </div>

      {/* Glow ring on hover */}
      {isVip && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 blur-lg -z-10"
        />
      )}
    </motion.div>
  );
}
