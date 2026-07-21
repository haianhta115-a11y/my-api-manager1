"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/* ─── Types ─── */
interface CreateKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export interface CreatedKeyData {
  id: string;
  name: string;
  plainKey: string;
}

/* ─── Create Form Modal ─── */
export function CreateKeyModal({
  open,
  onOpenChange,
  onCreated,
}: CreateKeyModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState("30d");
  const [permissions, setPermissions] = useState("read");
  const [rateLimit, setRateLimit] = useState("60");
  const [createdKey, setCreatedKey] = useState<CreatedKeyData | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setName("");
    setExpiration("30d");
    setPermissions("read");
    setRateLimit("60");
    setCreatedKey(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          expiration,
          permissions,
          rateLimit: parseInt(rateLimit) || 60,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create key");
      }

      setCreatedKey({
        id: data.key.id,
        name: data.key.name,
        plainKey: data.plainKey,
      });
      onCreated();
    } catch (err) {
      toast.error("Failed to create key", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyFullKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.plainKey);
    setCopied(true);
    toast.success("Full API key copied to clipboard!", {
      description: "Store it securely. You won't see it again.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleModalClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <AnimatePresence mode="wait">
        {!createdKey ? (
          /* ─── Create Form ─── */
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent className="sm:max-w-md bg-card border-white/10">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-400" />
                  Create New API Key
                </DialogTitle>
                <DialogDescription>
                  Generate a new API key with custom permissions and rate limits.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Key Name */}
                <div className="space-y-2">
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g. Production API, Staging, CI/CD"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    autoFocus
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <Label>Expiration</Label>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger className="bg-white/5 border-white/10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <Select value={permissions} onValueChange={setPermissions}>
                    <SelectTrigger className="bg-white/5 border-white/10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="read">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Read — Data access only
                        </span>
                      </SelectItem>
                      <SelectItem value="write">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          Write — Read + mutations
                        </span>
                      </SelectItem>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          Admin — Full access
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rate Limit */}
                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit (requests/min)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    min="1"
                    max="10000"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 10,000 requests per minute
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleModalClose(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!name.trim() || isCreating}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium min-w-[120px]"
                  >
                    {isCreating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="opacity-20"
                          />
                          <path
                            d="M12 2a10 10 0 019.95 9"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </motion.div>
                    ) : (
                      "Create Key"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </motion.div>
        ) : (
          /* ─── Secret Key Reveal ─── */
          <motion.div
            key="secret"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent
              className="sm:max-w-lg bg-card border-white/10"
              showCloseButton={false}
            >
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <DialogTitle>Key Created Successfully</DialogTitle>
                </div>
                <DialogDescription className="sr-only">
                  Your new API key has been generated. Copy it now.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Warning */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">
                      Save your API key now
                    </p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      For security, this is the <strong>only time</strong> you
                      will see this key. You won&apos;t be able to view it again.
                    </p>
                  </div>
                </div>

                {/* Key Display */}
                <div className="relative">
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                      {createdKey.name}
                    </p>
                    <code className="font-mono-key text-sm text-emerald-400 break-all leading-relaxed block">
                      {createdKey.plainKey}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs"
                    onClick={handleCopyFullKey}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Copied
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!copied) {
                      handleCopyFullKey();
                    }
                    handleModalClose(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium w-full sm:w-auto"
                >
                  {copied ? "Done" : "Copy & Done"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}