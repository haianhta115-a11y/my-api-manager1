"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Lock, Unlock, AlertTriangle, RefreshCw, KeyRound, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
}

export function SecurityView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  // Killswitch state
  const [killswitchOpen, setKillswitchOpen] = useState(false);
  const [targetEnv, setTargetEnv] = useState("all");
  const [killAction, setKillAction] = useState<"lock" | "unlock">("lock");
  const [executing, setExecuting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExecuteKillswitch = async () => {
    setExecuting(true);
    try {
      const res = await fetch("/api/keys/killswitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEnvironment: targetEnv,
          action: killAction,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to run killswitch");
      toast.success(json.message);
      setKillswitchOpen(false);
      fetchLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error executing killswitch");
    } finally {
      setExecuting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(search));

    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Security Threat Mitigation Header */}
      <div className="glass rounded-xl p-5 border border-white/5 bg-gradient-to-r from-red-950/20 via-black to-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm mb-1">
            <ShieldAlert className="w-5 h-5 text-destructive animate-pulse" />
            <span>Emergency Defense & Killswitch Center</span>
          </div>
          <h3 className="text-xl font-bold">Threat Anomaly & Killswitch Controls</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            In case of security breach, distributed brute-force attack, or compromised keys, immediately trigger the Emergency Killswitch to freeze keys across production or test environments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setKillAction("lock");
              setKillswitchOpen(true);
            }}
            className="bg-destructive hover:bg-destructive/90 text-white font-bold text-xs gap-1.5 shadow-lg shadow-destructive/20"
          >
            <Lock className="w-4 h-4" />
            Trigger Killswitch (Freeze All Keys)
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setKillAction("unlock");
              setKillswitchOpen(true);
            }}
            className="border-white/10 text-emerald-400 hover:bg-emerald-500/10 text-xs gap-1.5"
          >
            <Unlock className="w-4 h-4" />
            Lift Freeze
          </Button>
        </div>
      </div>

      {/* Audit Log Table Header & Filter */}
      <div className="glass rounded-xl p-5 border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold">Security & Audit Event Trail</h4>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search audit trail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white/5 border-white/10 text-xs h-8"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="h-8 text-xs bg-white/5 border-white/10 gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Audit Log List */}
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading security logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No audit logs found.
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const isDanger = log.action.includes("KILLSWITCH") || log.action.includes("REJECTED") || log.action.includes("BLOCKED");
              const isWarn = log.action.includes("RESET") || log.action.includes("REVOKED");

              return (
                <div key={log.id} className="p-3 flex items-start gap-3 text-xs hover:bg-white/[0.02]">
                  <div className="mt-0.5">
                    {isDanger ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-[11px] text-white">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5 break-all">
                      {log.details}
                    </p>
                    {log.ipAddress && (
                      <span className="text-[10px] font-mono text-emerald-400/80 mt-1 inline-block">
                        IP: {log.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Killswitch Confirmation Dialog */}
      <Dialog open={killswitchOpen} onOpenChange={setKillswitchOpen}>
        <DialogContent className="bg-card border-destructive/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Emergency {killAction === "lock" ? "Killswitch Lock" : "Unfreeze"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {killAction === "lock"
                ? "This action will immediately set the status of targeted keys to 'LOCKED'. Connected applications using these keys will fail verification until un-frozen."
                : "This action will restore locked keys back to 'ACTIVE' status."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Target Environment</label>
              <Select value={targetEnv} onValueChange={setTargetEnv}>
                <SelectTrigger className="bg-white/5 border-white/10 text-xs">
                  <SelectValue placeholder="Target Environment" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="all">All Environments (Global Lockdown)</SelectItem>
                  <SelectItem value="production">Production Only</SelectItem>
                  <SelectItem value="staging">Staging Only</SelectItem>
                  <SelectItem value="development">Development Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setKillswitchOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleExecuteKillswitch}
              disabled={executing}
              size="sm"
              className={killAction === "lock" ? "bg-destructive hover:bg-destructive/90 text-xs" : "bg-emerald-600 hover:bg-emerald-500 text-xs"}
            >
              {executing ? "Processing..." : killAction === "lock" ? "Execute Freeze Now" : "Unfreeze Keys"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
