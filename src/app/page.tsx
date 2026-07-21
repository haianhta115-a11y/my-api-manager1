"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricsCards, type MetricsData } from "@/components/dashboard/metrics-cards";
import { KeysTable, type ApiKeyItem } from "@/components/dashboard/keys-table";
import { CreateKeyModal } from "@/components/dashboard/create-key-modal";
import { RevokeDialog, DeleteDialog } from "@/components/dashboard/confirm-dialogs";

export default function DashboardPage() {
  // ─── Data State ───
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Modal State ───
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null);

  // ─── Fetch Data ───
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [keysRes, metricsRes] = await Promise.all([
        fetch("/api/keys"),
        fetch("/api/keys/metrics"),
      ]);

      if (!keysRes.ok || !metricsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const keysData = await keysRes.json();
      const metricsData = await metricsRes.json();

      setKeys(keysData.keys);
      setMetrics(metricsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Handlers ───
  const handleKeyCreated = () => {
    fetchAll();
  };

  const handleRevoked = () => {
    fetchAll();
  };

  const handleDeleted = () => {
    fetchAll();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Background Gradient ─── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <KeyRound className="w-4.5 h-4.5 text-emerald-400" />
              </motion.div>
              <div>
                <h1 className="text-sm font-semibold leading-none">
                  API Key Manager
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  Manage your API credentials
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Key
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Zap className="w-3 h-3" />
            <span>Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            API Keys
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create, manage, and monitor your API keys and access permissions.
          </p>
        </motion.div>

        {/* Metrics Cards */}
        <MetricsCards metrics={metrics} isLoading={isLoading} />

        {/* Keys Table */}
        <KeysTable
          keys={keys}
          isLoading={isLoading}
          error={error}
          onRevoke={(key) => setRevokeTarget(key)}
          onDelete={(key) => setDeleteTarget(key)}
        />
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-white/5 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>API Key Manager</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </span>
        </div>
      </footer>

      {/* ─── Modals ─── */}
      <CreateKeyModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleKeyCreated}
      />

      <RevokeDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        keyItem={revokeTarget}
        onRevoked={handleRevoked}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        keyItem={deleteTarget}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
