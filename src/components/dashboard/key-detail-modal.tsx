"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Copy,
  Check,
  Globe,
  Smartphone,
  Shield,
  Clock,
  Hash,
  Tag,
  FileText,
  Loader2,
  Trash2,
  Save,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ApiKeyItem } from "./keys-table";

interface ActivityLog {
  id: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  ipAddress: string | null;
  country: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface KeyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyItem: ApiKeyItem | null;
  onUpdated?: () => void;
  onOpenExpirationModal?: (key: ApiKeyItem) => void;
}

export function KeyDetailModal({
  open,
  onOpenChange,
  keyItem,
  onUpdated,
  onOpenExpirationModal,
}: KeyDetailModalProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Notes state
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (open && keyItem) {
      setNotes(keyItem.notes || "");
      let cancelled = false;
      fetch(`/api/keys/${keyItem.id}/activity`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && data.logs) setLogs(data.logs);
        })
        .catch(console.error)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [open, keyItem]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = async () => {
    if (!keyItem) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      toast.success("Internal notes saved");
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleUnbindHwidDevice = async (hwidToRemove: string) => {
    if (!keyItem) return;
    const currentHwids = (keyItem.allowedIps || keyItem.hwid || "")
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h && h !== hwidToRemove);

    try {
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hwid: currentHwids.join(",") }),
      });
      if (!res.ok) throw new Error("Failed to unbind HWID");
      toast.success(`Unbound HWID '${hwidToRemove.slice(0, 10)}...'`);
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error unbinding HWID");
    }
  };

  if (!keyItem) return null;

  const boundHwids = keyItem.hwid ? keyItem.hwid.split(",").map((h) => h.trim()).filter(Boolean) : [];
  const expiresDate = keyItem.expiresAt ? new Date(keyItem.expiresAt) : null;
  const isExpired = expiresDate ? expiresDate < new Date() : false;

  const statusColor =
    keyItem.status === "active"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
      : keyItem.status === "revoked"
      ? "bg-destructive/15 text-destructive border-destructive/20"
      : keyItem.status === "locked"
      ? "bg-purple-500/15 text-purple-400 border-purple-500/20"
      : "bg-amber-500/15 text-amber-400 border-amber-500/20";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-emerald-400 text-lg">
              <Activity className="w-5 h-5" />
              Key Details: {keyItem.name}
            </DialogTitle>
            {onOpenExpirationModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenExpirationModal(keyItem);
                }}
                className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Manage Expiration
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Key Identifier Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <code className="font-mono text-xs text-emerald-400 truncate select-all">
              {keyItem.keyPrefix}••••••••{keyItem.keySuffix}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={() => handleCopy(`${keyItem.keyPrefix}••••••••${keyItem.keySuffix}`)}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20 capitalize">
              Env: {keyItem.environment || "production"}
            </Badge>
            <Badge variant="outline" className={statusColor}>
              {keyItem.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Timestamps & Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-emerald-400" /> Created At
            </span>
            <p className="font-mono font-medium">{new Date(keyItem.createdAt).toLocaleString()}</p>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-purple-400" /> Last Used
            </span>
            <p className="font-mono font-medium">
              {keyItem.lastUsedAt ? new Date(keyItem.lastUsedAt).toLocaleString() : "Never"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-sky-400" /> Expiration Date
            </span>
            <p className={`font-mono font-medium ${isExpired ? "text-amber-400" : ""}`}>
              {expiresDate ? expiresDate.toLocaleString() : "Never Expires"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-amber-400" /> Total Requests
            </span>
            <p className="font-mono font-bold text-emerald-400">{keyItem.requestCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Bound HWIDs Section */}
        <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              Bound HWIDs ({boundHwids.length} / {keyItem.maxDevices} Devices)
            </span>
          </div>

          {boundHwids.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No hardware devices bound yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {boundHwids.map((h, idx) => (
                <div
                  key={h}
                  className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/10 font-mono text-xs"
                >
                  <span className="truncate mr-2">
                    #{idx + 1}: {h}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnbindHwidDevice(h)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Unbind Device"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Editor */}
        <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Internal Notes & Client Info
            </span>
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 gap-1"
            >
              <Save className="w-3 h-3" />
              Save Notes
            </Button>
          </div>
          <Textarea
            placeholder="Add internal notes, customer contract ID, support history..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="bg-black/40 border-white/10 text-xs"
          />
        </div>

        {/* Recent API Requests Log - Timeline View */}
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            API Verification Timeline (Last 100 requests)
          </h4>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">No verification logs for this key</div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-0">
              {logs.map((log, idx) => (
                <div key={log.id} className="relative flex gap-3 pb-3 pl-4 group">
                  {/* Timeline line */}
                  {idx < logs.length - 1 && (
                    <div className="absolute left-[5px] top-3 bottom-0 w-px bg-white/5 group-hover:bg-emerald-500/20 transition-colors" />
                  )}
                  {/* Timeline dot */}
                  <div className={`relative mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 ${
                    log.statusCode === 200
                      ? "bg-emerald-500/30 border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                      : "bg-destructive/30 border-destructive shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                  }`} />
                  {/* Content */}
                  <div className="flex-1 min-w-0 p-2 rounded-lg bg-white/[0.01] border border-white/5 group-hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={log.statusCode === 200 ? "text-emerald-400" : "text-destructive"}>
                          {log.statusCode}
                        </span>
                        <span className="text-muted-foreground truncate">{log.endpoint}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                        <span>{log.latencyMs}ms</span>
                        <span className="hidden sm:inline">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      IP: {log.ipAddress || "127.0.0.1"}
                      {log.country && <span> · {log.country}</span>}
                      {log.userAgent && <span className="hidden sm:inline"> · {log.userAgent.slice(0, 40)}...</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
