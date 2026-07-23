"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Plus,
  Zap,
  LogOut,
  User,
  VolumeX,
  Volume2,
  SkipForward,
  ShieldAlert,
  Layers,
  Settings,
  BarChart3,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Lock,
  Terminal,
  Webhook as WebhookIcon,
  ShieldCheck,
  Download,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VipBadge } from "@/components/dashboard/vip-badge";
import { MetricsCards, type MetricsData } from "@/components/dashboard/metrics-cards";
import { KeysTable, type ApiKeyItem } from "@/components/dashboard/keys-table";
import { CreateKeyModal } from "@/components/dashboard/create-key-modal";
import { EditKeyModal } from "@/components/dashboard/edit-key-modal";
import { BulkKeyModal } from "@/components/dashboard/bulk-key-modal";
import { AuditLogsModal } from "@/components/dashboard/audit-logs-modal";
import { RevokeDialog, DeleteDialog } from "@/components/dashboard/confirm-dialogs";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { BatchToolbar } from "@/components/dashboard/batch-toolbar";
import { KeyDetailModal } from "@/components/dashboard/key-detail-modal";
import { ExpirationModal } from "@/components/dashboard/expiration-modal";

// Premium Views
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { SdkSandboxView } from "@/components/dashboard/sdk-sandbox-view";
import { WebhooksView } from "@/components/dashboard/webhooks-view";
import { SecurityView } from "@/components/dashboard/security-view";
import { ExportImportModal } from "@/components/dashboard/export-import-modal";
import { IpLookupView } from "@/components/dashboard/ip-lookup-view";
import { SecurityInspectorView } from "@/components/dashboard/security-inspector-view";
import { SystemHealthView } from "@/components/dashboard/system-health-view";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"keys" | "ip-lookup" | "crypto-inspector" | "analytics" | "sandbox" | "webhooks" | "security" | "system">("keys");

  // Music State
  const [isMuted, setIsMuted] = useState(true);
  const [stationIdx, setStationIdx] = useState(0);
  const STATIONS = [
    { name: "Lofi Girl Radio", url: "jfKfPfyJRdk" },
    { name: "Cyberpunk Synthwave", url: "4xDzrJKXOOY" },
    { name: "Chillstep", url: "7NOSDKb0HlU" },
  ];
  const currentStation = STATIONS[stationIdx];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") {
        router.replace("/login");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [status, router]);

  if (status === "unauthenticated") return null;

  // Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [exportImportOpen, setExportImportOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiKeyItem | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<ApiKeyItem | null>(null);
  const [expirationTarget, setExpirationTarget] = useState<ApiKeyItem | null>(null);

  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchAll = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    setError(null);
    try {
      const [keysRes, metricsRes] = await Promise.all([
        fetch("/api/keys"),
        fetch("/api/keys/metrics"),
      ]);
      if (!keysRes.ok || !metricsRes.ok) throw new Error("Failed to fetch data");
      const keysData = await keysRes.json();
      const metricsData = await metricsRes.json();
      setKeys(keysData.keys);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => { startTransition(() => { fetchAll(); }); }, [fetchAll]);

  const handleKeyCreated = () => { fetchAll(); };
  const handleKeyEdited = () => { fetchAll(); };
  const handleRevoked = () => { fetchAll(); setSelectedIds([]); };
  const handleDeleted = () => { fetchAll(); setSelectedIds([]); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCreateOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-emerald-400">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <Zap className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-500/30 scanline-bg relative overflow-x-hidden transition-colors duration-300">
      {/* Animated Floating Cyber Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <Image src="/anime-bg.png" alt="" fill className="object-cover opacity-20 filter blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-emerald-950/20" />

        {/* Floating Glowing Spheres */}
        <motion.div
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -60, 40, 0], y: [0, 50, -20, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-sky-500/10 blur-[140px]"
        />
      </div>

      {/* Music Player */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 group">
        <iframe
          width="0" height="0"
          src={`https://www.youtube.com/embed/${currentStation.url}?autoplay=1&loop=1&playlist=${currentStation.url}&mute=${isMuted ? 1 : 0}`}
          title="Background Music" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="hidden"
        />
        <div className="flex bg-card/90 border border-border rounded-full p-1 backdrop-blur-md shadow-lg shadow-emerald-500/10">
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}
            className="hover:bg-accent text-emerald-400 rounded-full w-9 h-9">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <div className="w-0 overflow-hidden group-hover:w-32 transition-all duration-300 ease-in-out flex items-center">
            <span className="text-[10px] font-medium text-foreground/80 uppercase tracking-widest pl-2 truncate w-full">
              {isMuted ? "Muted" : currentStation.name}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setStationIdx((prev) => (prev + 1) % STATIONS.length)}
            className="hover:bg-accent text-emerald-400 rounded-full w-9 h-9" title="Next Station">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
        <div className="text-[10px] text-foreground/80 bg-card/90 border border-border rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg font-semibold">
          <kbd className="text-emerald-400 font-mono">Ctrl+K</kbd> New key
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <KeyRound className="w-4.5 h-4.5 text-emerald-400" />
              </motion.div>
              <div>
                <h1 className="text-sm font-bold leading-none flex items-center gap-1.5">
                  API Guardian Pro
                  <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">
                    Ultra Elite
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Enterprise Cryptographic License Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Export Backup Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportImportOpen(true)}
                className="border-border text-xs text-foreground hover:bg-accent hidden md:flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                Backup / Export
              </Button>

              {/* Theme Toggle Button */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8 text-foreground hover:text-emerald-400 transition-transform hover:scale-110"
                  title="Toggle Light / Dark Theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkOpen(true)}
                className="border-border text-foreground hover:bg-accent hidden sm:flex items-center gap-1.5 btn-shimmer"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                Bulk Generator
              </Button>

              <Link href="/settings">
                <Button variant="ghost" size="icon" className="text-foreground hover:text-emerald-400 transition-transform hover:scale-110 h-8 w-8" title="Settings">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>

              <div className="hidden sm:flex items-center gap-2 mr-2">
                <VipBadge role="admin" email={session?.user?.email} />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-border">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{session?.user?.email}</span>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => signOut()}
                className="text-foreground/80 hover:text-destructive hover:bg-destructive/10 h-8 w-8" title="Log out">
                <LogOut className="w-4 h-4" />
              </Button>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] btn-shimmer border-0 h-8"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Key
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Navigation Bar Tabs with High Contrast */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-2 border-t border-border">
            {[
              { id: "keys", label: "API Keys Grid", icon: KeyRound, count: keys.length },
              { id: "ip-lookup", label: "Geo-IP & Threat Radar", icon: Globe },
              { id: "crypto-inspector", label: "HMAC Signature Engine", icon: Lock },
              { id: "analytics", label: "Analytics & Traffic", icon: BarChart3 },
              { id: "sandbox", label: "API Sandbox & SDK", icon: Terminal },
              { id: "webhooks", label: "Webhooks & Automation", icon: WebhookIcon },
              { id: "system", label: "System Health", icon: ShieldAlert },
              { id: "security", label: "Security Audit & Killswitch", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 relative ${
                    isActive
                      ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-sm font-bold"
                      : "text-foreground/80 hover:text-foreground hover:bg-accent font-semibold"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-foreground/70"}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] font-mono bg-accent px-1.5 py-0.2 rounded-full text-foreground font-bold">
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content with View Transitions */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === "keys" && (
            <motion.div
              key="keys-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Hero Title */}
              <div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Enterprise Licensing Matrix</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-emerald-400 bg-clip-text text-transparent">
                  API Key & License Management
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create, inspect, manage, and extend your API credentials, device HWID bindings, and expiration rules.
                </p>
              </div>

              {/* Metrics Cards */}
              <MetricsCards metrics={metrics} isLoading={isLoading} />

              {/* Batch Operations Toolbar */}
              <BatchToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
                onComplete={fetchAll}
              />

              {/* Keys Table */}
              <KeysTable
                keys={keys}
                isLoading={isLoading}
                error={error}
                onEdit={(key) => setEditTarget(key)}
                onRevoke={(key) => setRevokeTarget(key)}
                onDelete={(key) => setDeleteTarget(key)}
                onDetail={(key) => setDetailTarget(key)}
                onExtendExpiration={(key) => setExpirationTarget(key)}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </motion.div>
          )}

          {activeTab === "ip-lookup" && (
            <motion.div
              key="ip-lookup-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <IpLookupView />
            </motion.div>
          )}

          {activeTab === "crypto-inspector" && (
            <motion.div
              key="crypto-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SecurityInspectorView />
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsView />
            </motion.div>
          )}

          {activeTab === "sandbox" && (
            <motion.div
              key="sandbox-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SdkSandboxView />
            </motion.div>
          )}

          {activeTab === "webhooks" && (
            <motion.div
              key="webhooks-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WebhooksView />
            </motion.div>
          )}

          {activeTab === "system" && (
            <motion.div
              key="system-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SystemHealthView />
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SecurityView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-4 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-mono">
            <span>API Guardian Pro Ultra Elite v3.0</span>
            <Sparkles className="w-3 h-3 text-emerald-400" />
          </span>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="hover:text-emerald-400 transition-colors">Settings</Link>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              All security radar nodes active
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateKeyModal open={createOpen} onOpenChange={setCreateOpen} onCreated={handleKeyCreated} />
      <BulkKeyModal open={bulkOpen} onOpenChange={setBulkOpen} onCreated={handleKeyCreated} />
      <AuditLogsModal open={logsOpen} onOpenChange={setLogsOpen} />
      <ExportImportModal open={exportImportOpen} onOpenChange={setExportImportOpen} onImportComplete={fetchAll} />
      <EditKeyModal open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} keyItem={editTarget} onEdited={handleKeyEdited} />
      <KeyDetailModal open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)} keyItem={detailTarget} onUpdated={fetchAll} onOpenExpirationModal={(key) => setExpirationTarget(key)} />
      <ExpirationModal open={!!expirationTarget} onOpenChange={(open) => !open && setExpirationTarget(null)} keyItem={expirationTarget} onExtended={fetchAll} />
      <RevokeDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)} keyItem={revokeTarget} onRevoked={handleRevoked} />
      <DeleteDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} keyItem={deleteTarget} onDeleted={handleDeleted} />
    </div>
  );
}
