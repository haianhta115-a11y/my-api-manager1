"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ShieldOff,
  Trash2,
  MoreHorizontal,
  KeyRound,
  Edit2,
  Search,
  RotateCcw,
  Globe,
  Clock,
  Eye,
  CheckSquare,
  Square,
  Calendar,
  Crown,
  ZapOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useState } from "react";

export type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  keySuffix: string;
  status: string;
  permissions: string;
  environment?: string;
  allowedIps?: string | null;
  tags?: string | null;
  notes?: string | null;
  licenseType: string;
  maxDevices: number;
  rateLimit: number;
  expiration: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  requestCount: number;
  hwid?: string | null;
  createdAt: string;
  updatedAt: string;
};

interface KeysTableProps {
  keys: ApiKeyItem[];
  isLoading: boolean;
  error: string | null;
  onEdit: (key: ApiKeyItem) => void;
  onRevoke: (key: ApiKeyItem) => void;
  onDelete: (key: ApiKeyItem) => void;
  onDetail?: (key: ApiKeyItem) => void;
  onExtendExpiration?: (key: ApiKeyItem) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function TableSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-white/5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-5 w-28 flex-shrink-0" />
            <Skeleton className="h-5 w-48 flex-1" />
            <Skeleton className="h-5 w-20 hidden sm:block" />
            <Skeleton className="h-5 w-24 hidden md:block" />
            <Skeleton className="h-6 w-16 hidden md:block" />
            <Skeleton className="h-8 w-8 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyRow({
  keyItem,
  onEdit,
  onRevoke,
  onDelete,
  onDetail,
  onExtendExpiration,
  isSelected,
  onToggleSelect,
}: {
  keyItem: ApiKeyItem;
  onEdit: (key: ApiKeyItem) => void;
  onRevoke: (key: ApiKeyItem) => void;
  onDelete: (key: ApiKeyItem) => void;
  onDetail?: (key: ApiKeyItem) => void;
  onExtendExpiration?: (key: ApiKeyItem) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const maskedKey = `${keyItem.keyPrefix}••••••••${keyItem.keySuffix}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(maskedKey);
    setCopied(true);
    toast.success("Key reference copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig =
    keyItem.status === "active"
      ? { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }
      : keyItem.status === "revoked"
      ? { label: "Revoked", className: "bg-destructive/15 text-destructive border-destructive/20" }
      : keyItem.status === "locked"
      ? { label: "Locked", className: "bg-purple-500/15 text-purple-400 border-purple-500/20" }
      : { label: "Expired", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" };

  const envConfig =
    keyItem.environment === "staging"
      ? { label: "Staging", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
      : keyItem.environment === "development"
      ? { label: "Dev", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" }
      : { label: "Prod", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };

  const formatTimestamp = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Expiration Badge calculation
  const expiresDate = keyItem.expiresAt ? new Date(keyItem.expiresAt) : null;
  const now = new Date();
  const isExpired = expiresDate ? expiresDate < now : false;

  let expirationText = "Never";
  if (expiresDate) {
    const diff = expiresDate.getTime() - now.getTime();
    if (diff <= 0) {
      expirationText = "Expired";
    } else {
      const days = Math.floor(diff / (1000 * 3600 * 24));
      const hours = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600));
      expirationText = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
    }
  }

  const isRevoked = keyItem.status === "revoked" || keyItem.status === "locked";
  const tagsList = keyItem.tags ? keyItem.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 hover:bg-white/[0.02] transition-colors duration-200 ${
        isRevoked ? "opacity-60" : ""
      } ${isSelected ? "bg-emerald-500/[0.04]" : ""}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggleSelect}
        className="text-muted-foreground hover:text-white transition-colors"
      >
        {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
      </button>

      {/* Name & Env */}
      <div className="flex-shrink-0 w-full sm:w-44 space-y-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${envConfig.className}`}>
            {envConfig.label}
          </Badge>
          <p className="font-semibold text-xs truncate text-white">{keyItem.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[9px] px-1 py-0 h-3.5 ${
              keyItem.licenseType === "lifetime" || keyItem.licenseType === "enterprise"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : keyItem.licenseType === "subscription"
                ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                : "bg-white/5 text-muted-foreground border-white/10"
            }`}
          >
            {keyItem.licenseType === "lifetime" && <Crown className="w-2 h-2 mr-0.5" />}
            {keyItem.licenseType}
          </Badge>
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagsList.map((t) => (
                <span key={t} className="text-[9px] bg-white/5 text-muted-foreground px-1.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Masked Key */}
      <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="font-mono text-xs text-muted-foreground bg-white/5 px-2.5 py-1 rounded truncate select-all">
                {maskedKey}
              </code>
            </TooltipTrigger>
            <TooltipContent side="top">Click copy button to copy reference</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {keyItem.allowedIps && (
          <Badge variant="outline" className="text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20 gap-1 hidden lg:flex">
            <Globe className="w-2.5 h-2.5" />
            IP Allowed
          </Badge>
        )}
      </div>

      {/* Expiration Countdown */}
      <div className="hidden md:flex flex-shrink-0 w-32 items-center gap-1.5 text-[11px]">
        <Clock className={`w-3 h-3 ${isExpired ? "text-amber-400" : "text-muted-foreground"}`} />
        <span className={`font-mono ${isExpired ? "text-amber-400 font-bold" : "text-muted-foreground"}`}>
          {expirationText}
        </span>
      </div>

      {/* Status Badge */}
      <div className="hidden md:flex flex-shrink-0">
        <Badge variant="outline" className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto sm:ml-0 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>

        {onDetail && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-emerald-400"
            onClick={() => onDetail(keyItem)}
            title="Inspect Key Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-white/10 text-xs">
            {onDetail && (
              <DropdownMenuItem onClick={() => onDetail(keyItem)}>
                <Eye className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Inspect Key Details
              </DropdownMenuItem>
            )}
            {onExtendExpiration && (
              <DropdownMenuItem onClick={() => onExtendExpiration(keyItem)}>
                <Calendar className="mr-2 h-3.5 w-3.5 text-sky-400" /> Extend Expiration
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(keyItem)}>
              <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Key Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-sky-400"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/keys/${keyItem.id}/reset-hwid`, { method: "POST" });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed to reset HWID");
                  toast.success("HWID reset successfully!");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "HWID reset failed");
                }
              }}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset HWID Binding
            </DropdownMenuItem>

            {!isRevoked && (
              <DropdownMenuItem className="text-amber-400" onClick={() => onRevoke(keyItem)}>
                <ShieldOff className="mr-2 h-3.5 w-3.5" /> Revoke Access
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(keyItem)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export function KeysTable({
  keys,
  isLoading,
  error,
  onEdit,
  onRevoke,
  onDelete,
  onDetail,
  onExtendExpiration,
  selectedIds,
  onSelectionChange,
}: KeysTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  if (isLoading) return <TableSkeleton />;
  if (error) return <div className="p-8 text-center text-xs text-destructive">{error}</div>;

  const filteredKeys = keys.filter((key) => {
    const matchesSearch =
      key.name.toLowerCase().includes(search.toLowerCase()) ||
      key.keyPrefix.toLowerCase().includes(search.toLowerCase()) ||
      key.keySuffix.toLowerCase().includes(search.toLowerCase()) ||
      (key.tags && key.tags.toLowerCase().includes(search.toLowerCase())) ||
      (key.hwid && key.hwid.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || key.status === statusFilter;
    const matchesEnv = envFilter === "all" || key.environment === envFilter;
    const matchesLicense = licenseTypeFilter === "all" || key.licenseType === licenseTypeFilter;

    return matchesSearch && matchesStatus && matchesEnv && matchesLicense;
  });

  const totalPages = Math.max(1, Math.ceil(filteredKeys.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedKeys = filteredKeys.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const allSelected = filteredKeys.length > 0 && filteredKeys.every((k) => selectedIds.includes(k.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredKeys.map((k) => k.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setEnvFilter("all");
    setLicenseTypeFilter("all");
    setPage(0);
  };

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag, or HWID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 bg-white/5 border-white/10 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={envFilter} onValueChange={(v) => { setEnvFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-xs h-8">
              <SelectValue placeholder="Env" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-xs">
              <SelectItem value="all">All Envs</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Dev</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-xs h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={licenseTypeFilter} onValueChange={(v) => { setLicenseTypeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[110px] bg-white/5 border-white/10 text-xs h-8">
              <SelectValue placeholder="License" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-xs">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Header */}
      <div className="p-3.5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <button type="button" onClick={toggleSelectAll} className="hover:text-white">
            {allSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
          </button>
          <div className="w-full sm:w-44">Name & Environment</div>
          <div className="hidden sm:block flex-1">Key Reference</div>
          <div className="hidden md:block w-32">Expiration Countdown</div>
          <div className="hidden md:block">Status</div>
          <div className="w-24 text-right">Actions</div>
        </div>
      </div>

      {/* Body */}
      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/20">
            <KeyRound className="w-8 h-8 text-emerald-400/60" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No API Keys Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Your first API key is just a click away. Create one to start managing your license infrastructure.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-accent/50 px-3 py-2 rounded-lg border border-border">
            <kbd className="font-mono text-emerald-400 font-bold">Ctrl+K</kbd>
            <span>or click the</span>
            <span className="text-emerald-400 font-semibold">Create Key</span>
            <span>button above</span>
          </div>
        </div>
      ) : filteredKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
          <ZapOff className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p className="text-xs text-muted-foreground">No keys match current search and environment filters.</p>
          <button
            onClick={clearFilters}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 mt-2 underline underline-offset-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {paginatedKeys.map((keyItem) => (
              <KeyRow
                key={keyItem.id}
                keyItem={keyItem}
                onEdit={onEdit}
                onRevoke={onRevoke}
                onDelete={onDelete}
                onDetail={onDetail}
                onExtendExpiration={onExtendExpiration}
                isSelected={selectedIds.includes(keyItem.id)}
                onToggleSelect={() => toggleSelect(keyItem.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredKeys.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-white/[0.01] text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {filteredKeys.length} key{filteredKeys.length !== 1 ? "s" : ""}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[10px]">
              Page {safePage + 1} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="w-[72px] h-6 bg-white/5 border-white/10 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-xs min-w-0">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={safePage === 0}
                onClick={() => setPage(0)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(safePage + 1)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(totalPages - 1)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
