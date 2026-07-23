"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, Terminal, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogsModal({ open, onOpenChange }: AuditLogsModalProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchLogs();
  }, [open]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "KEY_VERIFIED":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">VERIFIED</Badge>;
      case "HWID_REJECTED":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">HWID REJECTED</Badge>;
      case "HWID_RESET":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">HWID RESET</Badge>;
      case "BULK_KEY_GENERATE":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">BULK GENERATED</Badge>;
      default:
        return <Badge variant="outline" className="text-white/70">LOG</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-black/95 border-emerald-500/30 text-white backdrop-blur-[24px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 text-xl font-bold">
              <ShieldAlert className="w-5 h-5" />
              Cyberpunk Security Audit Logs
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-1">
              Real-time API requests, HWID device binding events, and security anomaly detection.
            </DialogDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            disabled={isLoading}
            className="border-white/10 text-emerald-400 hover:bg-emerald-500/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </DialogHeader>

        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 max-h-[420px] overflow-y-auto font-mono text-xs space-y-3">
          {logs.length === 0 ? (
            <div className="text-center text-white/40 py-12">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No security audit logs recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors gap-2"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getActionBadge(log.action)}
                      <span className="text-white/40 text-[10px]">
                        IP: {log.ipAddress || "Unknown"}
                      </span>
                    </div>
                    <p className="text-white/80">{log.details}</p>
                  </div>
                </div>
                <div className="text-[10px] text-white/40 text-right font-sans">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
