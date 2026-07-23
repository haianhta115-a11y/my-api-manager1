"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  Tag,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function CreateKeyModal({
  open,
  onOpenChange,
  onCreated,
}: CreateKeyModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [expiration, setExpiration] = useState("30d");
  const [permissions, setPermissions] = useState("read");
  const [rateLimit, setRateLimit] = useState("60");
  const [licenseType, setLicenseType] = useState("lifetime");
  const [maxDevices, setMaxDevices] = useState("1");
  const [allowedIps, setAllowedIps] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  const [createdKey, setCreatedKey] = useState<CreatedKeyData | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setName("");
    setEnvironment("production");
    setExpiration("30d");
    setPermissions("read");
    setRateLimit("60");
    setLicenseType("lifetime");
    setMaxDevices("1");
    setAllowedIps("");
    setTags("");
    setNotes("");
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
          environment,
          expiration,
          permissions,
          rateLimit: parseInt(rateLimit) || 60,
          licenseType,
          maxDevices: parseInt(maxDevices) || 1,
          allowedIps: allowedIps.trim(),
          tags: tags.trim(),
          notes: notes.trim(),
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

  const handleModalClose = (openState: boolean) => {
    if (!openState) resetForm();
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <AnimatePresence mode="wait">
        {!createdKey ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent className="sm:max-w-3xl bg-card border-white/10 p-0 overflow-hidden flex flex-col md:flex-row gap-0 max-h-[90vh] overflow-y-auto">
              {/* Anime Side */}
              <div className="hidden md:block w-1/3 relative bg-black border-r border-white/5 min-h-[500px]">
                <Image
                  src="/anime-create.png"
                  alt="Create Key Anime"
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-xl font-bold text-white mb-1">API Guardian Pro</h3>
                  <p className="text-xs text-white/60">Issue enterprise credentials with environment scope and IP whitelist.</p>
                </div>
              </div>

              {/* Form Side */}
              <div className="w-full md:w-2/3 p-6 sm:p-8">
                <DialogHeader className="mb-4">
                  <DialogTitle className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                    Create New API Key
                  </DialogTitle>
                  <DialogDescription>
                    Configure environment, rate limits, license rules, and security restrictions.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name & Environment Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="key-name" className="text-xs">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g. Production API v2"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/5 border-white/10 text-xs"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Environment</Label>
                      <Select value={environment} onValueChange={setEnvironment}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="production">Production (sk_live_)</SelectItem>
                          <SelectItem value="staging">Staging (sk_stg_)</SelectItem>
                          <SelectItem value="development">Development (sk_test_)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Expiration & Permissions Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Expiration</Label>
                      <Select value={expiration} onValueChange={setExpiration}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-xs w-full">
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

                    <div className="space-y-1.5">
                      <Label className="text-xs">Permissions</Label>
                      <Select value={permissions} onValueChange={setPermissions}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="read">Read — Access only</SelectItem>
                          <SelectItem value="write">Write — Read + Mutations</SelectItem>
                          <SelectItem value="admin">Admin — Full Root Control</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* License Type & Max Devices Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">License Model</Label>
                      <Select value={licenseType} onValueChange={setLicenseType}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="lifetime">Lifetime</SelectItem>
                          <SelectItem value="subscription">Subscription</SelectItem>
                          <SelectItem value="concurrent">Concurrent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="max-devices" className="text-xs">Max Devices (HWID)</Label>
                      <Input
                        id="max-devices"
                        type="number"
                        min="1"
                        max="100"
                        value={maxDevices}
                        onChange={(e) => setMaxDevices(e.target.value)}
                        className="bg-white/5 border-white/10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Rate Limit & IP Whitelist Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rate-limit" className="text-xs">Rate Limit (req/min)</Label>
                      <Input
                        id="rate-limit"
                        type="number"
                        min="1"
                        max="10000"
                        value={rateLimit}
                        onChange={(e) => setRateLimit(e.target.value)}
                        className="bg-white/5 border-white/10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="allowed-ips" className="text-xs flex items-center gap-1">
                        <Globe className="w-3 h-3 text-sky-400" />
                        Allowed IPs (Comma-separated)
                      </Label>
                      <Input
                        id="allowed-ips"
                        placeholder="192.168.1.1, 10.0.0.1 (Optional)"
                        value={allowedIps}
                        onChange={(e) => setAllowedIps(e.target.value)}
                        className="bg-white/5 border-white/10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <Label htmlFor="key-tags" className="text-xs flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-400" />
                      Tags (Comma-separated)
                    </Label>
                    <Input
                      id="key-tags"
                      placeholder="client-v2, vip, desktop"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="bg-white/5 border-white/10 text-xs"
                    />
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleModalClose(false)}
                      disabled={isCreating}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!name.trim() || isCreating}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs min-w-[110px]"
                    >
                      {isCreating ? "Creating..." : "Create API Key"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </motion.div>
        ) : (
          <motion.div
            key="secret"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent className="sm:max-w-lg bg-card border-white/10" showCloseButton={false}>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <DialogTitle>Key Created Successfully</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Save your API key now</p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      For security, this is the <strong>only time</strong> you will see this key.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">{createdKey.name}</p>
                    <code className="font-mono-key text-sm text-emerald-400 break-all block">
                      {createdKey.plainKey}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs"
                    onClick={handleCopyFullKey}
                  >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!copied) handleCopyFullKey();
                    handleModalClose(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium w-full text-xs"
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