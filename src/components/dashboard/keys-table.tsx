"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ShieldOff,
  Trash2,
  MoreHorizontal,
  KeyRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  rateLimit: number;
  expiration: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
  updatedAt: string;
};

interface KeysTableProps {
  keys: ApiKeyItem[];
  isLoading: boolean;
  error: string | null;
  onRevoke: (key: ApiKeyItem) => void;
  onDelete: (key: ApiKeyItem) => void;
}

/* ─── Skeleton Loading ─── */
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

/* ─── Empty State ─── */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
        <KeyRound className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Create your first API key to start integrating with the API. Keys can be
        scoped with specific permissions and rate limits.
      </p>
      <Button
        onClick={onCreateClick}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
      >
        Create your first key
      </Button>
    </motion.div>
  );
}

/* ─── Error State ─── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldOff className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </motion.div>
  );
}

/* ─── Key Row ─── */
function KeyRow({
  keyItem,
  onRevoke,
  onDelete,
}: {
  keyItem: ApiKeyItem;
  onRevoke: (key: ApiKeyItem) => void;
  onDelete: (key: ApiKeyItem) => void;
}) {
  const [copied, setCopied] = useState(false);

  const maskedKey = `${keyItem.keyPrefix}••••••••${keyItem.keySuffix}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Copy the masked key as a display reference
    await navigator.clipboard.writeText(maskedKey);
    setCopied(true);
    toast.success("Key reference copied to clipboard", {
      description: "This is the masked key display. The full key is only shown once at creation.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig =
    keyItem.status === "active"
      ? { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }
      : keyItem.status === "revoked"
        ? { label: "Revoked", className: "bg-destructive/15 text-destructive border-destructive/20" }
        : { label: "Expired", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" };

  const permColor =
    keyItem.permissions === "admin"
      ? "text-purple-400"
      : keyItem.permissions === "write"
        ? "text-sky-400"
        : "text-emerald-400";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isRevoked = keyItem.status === "revoked";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.25 }}
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 hover:bg-white/[0.02] transition-colors duration-200 ${
        isRevoked ? "opacity-50" : ""
      }`}
    >
      {/* Name */}
      <div className="flex-shrink-0 w-full sm:w-40">
        <p className="font-medium text-sm truncate">{keyItem.name}</p>
        <p className="text-xs text-muted-foreground truncate sm:hidden">
          {maskedKey}
        </p>
      </div>

      {/* Masked Key + Copy (hidden on mobile, shown inline above) */}
      <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="font-mono-key text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-md truncate cursor-default select-all">
                {maskedKey}
              </code>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-normal">
              Click &quot;Copy&quot; in actions to copy
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Created */}
      <div className="hidden md:block flex-shrink-0 w-24 text-xs text-muted-foreground">
        {formatDate(keyItem.createdAt)}
      </div>

      {/* Last Used */}
      <div className="hidden lg:block flex-shrink-0 w-24 text-xs text-muted-foreground">
        {keyItem.lastUsedAt
          ? new Date(keyItem.lastUsedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "Never"}
      </div>

      {/* Status Badge */}
      <div className="hidden md:flex flex-shrink-0">
        <Badge
          variant="outline"
          className={statusConfig.className}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto sm:ml-0 flex-shrink-0">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy key reference</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-popover border-white/10"
          >
            <DropdownMenuItem className="text-xs text-muted-foreground">
              <span className="font-medium mr-2">Scope:</span>
              <span className={`font-medium ${permColor} capitalize`}>
                {keyItem.permissions}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-muted-foreground">
              <span className="font-medium mr-2">Rate Limit:</span>
              <span className="font-mono-key">
                {keyItem.rateLimit}/min
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            {!isRevoked && (
              <DropdownMenuItem
                className="text-amber-400 focus:text-amber-300"
                onClick={() => onRevoke(keyItem)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke Key
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(keyItem)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

/* ─── Main Table Component ─── */
export function KeysTable({
  keys,
  isLoading,
  error,
  onRevoke,
  onDelete,
}: KeysTableProps) {
  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="w-full sm:w-40">Name</div>
          <div className="hidden sm:block flex-1">Key</div>
          <div className="hidden md:block w-24">Created</div>
          <div className="hidden lg:block w-24">Last Used</div>
          <div className="hidden md:block">Status</div>
          <div className="w-20 text-right">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      {keys.length === 0 ? (
        <EmptyState onCreateClick={() => {}} />
      ) : (
        <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
          <AnimatePresence>
            {keys.map((keyItem) => (
              <KeyRow
                key={keyItem.id}
                keyItem={keyItem}
                onRevoke={onRevoke}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer count */}
      {keys.length > 0 && (
        <div className="p-3 border-t border-white/5 text-xs text-muted-foreground">
          Showing {keys.length} key{keys.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}