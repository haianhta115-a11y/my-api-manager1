"use client";

import { useState } from "react";
import {
  ShieldOff,
  Trash2,
  Lock,
  CheckCircle2,
  Download,
  Loader2,
  Clock,
  RotateCcw,
  Globe,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface BatchToolbarProps {
  selectedIds: string[];
  onClear: () => void;
  onComplete: () => void;
}

export function BatchToolbar({ selectedIds, onClear, onComplete }: BatchToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [targetEnv, setTargetEnv] = useState("production");
  const count = selectedIds.length;

  if (count === 0) return null;

  const handleAction = async (action: string, payload?: Record<string, unknown>) => {
    setLoading(action);
    try {
      const res = await fetch("/api/keys/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: selectedIds, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(`Action '${action}' applied to ${data.count} key(s)`);
      onComplete();
      onClear();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async (format: string) => {
    setLoading(`export-${format}`);
    try {
      const res = await fetch(`/api/keys/export?format=${format}&ids=${selectedIds.join(",")}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `keys_export_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedIds.length} key(s) as ${format.toUpperCase()}`);
      onClear();
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setLoading(null);
    }
  };

  const isBusy = loading !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in slide-in-from-top-2">
      <span className="text-xs font-semibold text-emerald-400 mr-2">
        {count} keys selected
      </span>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("extend_30d")}
        disabled={isBusy}
        className="h-7 text-xs text-emerald-300 hover:bg-emerald-500/20"
      >
        {loading === "extend_30d" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Calendar className="w-3 h-3 mr-1 text-emerald-400" />}
        +30 Days
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("reset_hwid")}
        disabled={isBusy}
        className="h-7 text-xs text-sky-300 hover:bg-sky-500/20"
      >
        {loading === "reset_hwid" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1 text-sky-400" />}
        Reset HWIDs
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("activate")}
        disabled={isBusy}
        className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10"
      >
        {loading === "activate" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
        Activate
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("revoke")}
        disabled={isBusy}
        className="h-7 text-xs text-amber-400 hover:bg-amber-500/10"
      >
        {loading === "revoke" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ShieldOff className="w-3 h-3 mr-1" />}
        Revoke
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("lock")}
        disabled={isBusy}
        className="h-7 text-xs text-purple-400 hover:bg-purple-500/10"
      >
        {loading === "lock" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Lock className="w-3 h-3 mr-1" />}
        Lock
      </Button>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleAction("set_environment", { targetEnv })}
          disabled={isBusy}
          className="h-7 text-xs text-sky-400 hover:bg-sky-500/10"
        >
          {loading === "set_environment" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Globe className="w-3 h-3 mr-1" />}
          Set Env
        </Button>
        <Select value={targetEnv} onValueChange={setTargetEnv}>
          <SelectTrigger className="w-[100px] h-7 bg-white/5 border-white/10 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10 text-xs">
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="development">Development</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleExport("csv")}
        disabled={isBusy}
        className="h-7 text-xs text-sky-400 hover:bg-sky-500/10"
      >
        {loading === "export-csv" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
        CSV
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleExport("json")}
        disabled={isBusy}
        className="h-7 text-xs text-sky-400 hover:bg-sky-500/10"
      >
        {loading === "export-json" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
        JSON
      </Button>

      <div className="flex-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleAction("delete")}
        disabled={isBusy}
        className="h-7 text-xs text-destructive hover:bg-destructive/10"
      >
        {loading === "delete" ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
        Delete
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        disabled={isBusy}
        className="h-7 text-xs text-muted-foreground"
      >
        Cancel
      </Button>
    </div>
  );
}
