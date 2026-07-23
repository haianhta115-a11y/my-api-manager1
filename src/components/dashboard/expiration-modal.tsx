"use client";

import { useState } from "react";
import { Clock, Calendar, ShieldCheck, Zap, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ApiKeyItem } from "./keys-table";

interface ExpirationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyItem: ApiKeyItem | null;
  onExtended: () => void;
}

export function ExpirationModal({ open, onOpenChange, keyItem, onExtended }: ExpirationModalProps) {
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!keyItem) return null;

  const expiresDate = keyItem.expiresAt ? new Date(keyItem.expiresAt) : null;
  const now = new Date();
  const isExpired = expiresDate ? expiresDate < now : false;

  const calculateDaysLeft = () => {
    if (!expiresDate) return "Never Expires";
    const diff = expiresDate.getTime() - now.getTime();
    if (diff <= 0) {
      const pastMins = Math.floor(Math.abs(diff) / (1000 * 60));
      if (pastMins < 60) return `Expired ${pastMins} mins ago`;
      const pastHours = Math.floor(pastMins / 60);
      if (pastHours < 24) return `Expired ${pastHours} hours ago`;
      const pastDays = Math.floor(pastHours / 24);
      return `Expired ${pastDays} days ago`;
    }

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);

    return `Expires in ${days}d ${hours}h ${mins}m`;
  };

  const handleExtendDays = async (daysToAdd: number) => {
    setLoading(true);
    try {
      const base = expiresDate && expiresDate > now ? expiresDate : now;
      const newExp = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: newExp.toISOString(),
          status: "active",
          expiration: `${daysToAdd}d`,
        }),
      });

      if (!res.ok) throw new Error("Failed to extend expiration");
      toast.success(`Extended key '${keyItem.name}' by +${daysToAdd} days!`);
      onExtended();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extend expiration");
    } finally {
      setLoading(false);
    }
  };

  const handleSetCustomDate = async () => {
    if (!customDate) {
      toast.error("Please pick a target date & time");
      return;
    }

    setLoading(true);
    try {
      const target = new Date(customDate);
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: target.toISOString(),
          status: target > now ? "active" : "expired",
          expiration: "custom",
        }),
      });

      if (!res.ok) throw new Error("Failed to set expiration date");
      toast.success(`Updated expiration date for '${keyItem.name}'`);
      onExtended();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error setting custom date");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNeverExpires = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: null,
          status: "active",
          expiration: "never",
        }),
      });

      if (!res.ok) throw new Error("Failed to update expiration");
      toast.success(`Set '${keyItem.name}' to Never Expire!`);
      onExtended();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set never expire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Expiration & Renewal Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Key Info Banner */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{keyItem.name}</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isExpired
                    ? "bg-amber-500/20 text-amber-400"
                    : keyItem.expiration === "never"
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {calculateDaysLeft()}
              </span>
            </div>
            <p className="text-muted-foreground font-mono text-[11px]">
              Exact Expiration: {expiresDate ? expiresDate.toLocaleString() : "Never Expires"}
            </p>
          </div>

          {/* Quick Extension Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Extensions</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExtendDays(7)}
                disabled={loading}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs"
              >
                +7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExtendDays(30)}
                disabled={loading}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs text-emerald-400"
              >
                +30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExtendDays(365)}
                disabled={loading}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs text-purple-400"
              >
                +1 Year
              </Button>
            </div>
          </div>

          {/* Custom Date-Time Picker */}
          <div className="space-y-2 border-t border-white/5 pt-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Pick Exact Expiration Date & Time
            </Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-white/5 border-white/10 text-xs font-mono"
              />
              <Button
                onClick={handleSetCustomDate}
                disabled={loading || !customDate}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-xs whitespace-nowrap"
              >
                Apply Date
              </Button>
            </div>
          </div>

          {/* Never Expire Button */}
          <Button
            variant="ghost"
            onClick={handleSetNeverExpires}
            disabled={loading}
            className="w-full text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20"
          >
            Set to Never Expire
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
