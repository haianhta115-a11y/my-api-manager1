"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import Image from "next/image";
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
import type { ApiKeyItem } from "./keys-table";

interface EditKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdited: () => void;
  keyItem: ApiKeyItem | null;
}

export function EditKeyModal({
  open,
  onOpenChange,
  onEdited,
  keyItem,
}: EditKeyModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState("read");
  const [rateLimit, setRateLimit] = useState("60");
  const [licenseType, setLicenseType] = useState("lifetime");
  const [maxDevices, setMaxDevices] = useState("1");
  const [environment, setEnvironment] = useState("production");
  const [tags, setTags] = useState("");
  const [allowedIps, setAllowedIps] = useState("");
  const [notes, setNotes] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (keyItem && open) {
      setName(keyItem.name);
      setPermissions(keyItem.permissions);
      setRateLimit(keyItem.rateLimit.toString());
      setLicenseType(keyItem.licenseType || "lifetime");
      setMaxDevices(keyItem.maxDevices?.toString() || "1");
      setEnvironment(keyItem.environment || "production");
      setTags(keyItem.tags || "");
      setAllowedIps(keyItem.allowedIps || "");
      setNotes(keyItem.notes || "");
    }
  }, [keyItem, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !keyItem) return;

    setIsEditing(true);
    try {
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          permissions,
          rateLimit: parseInt(rateLimit) || 60,
          licenseType,
          maxDevices: parseInt(maxDevices) || 1,
          environment,
          tags: tags.trim(),
          allowedIps: allowedIps.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update key");
      }

      toast.success("Key updated successfully");
      onEdited();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update key", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent className="sm:max-w-3xl bg-card border-white/10 p-0 overflow-hidden flex flex-col md:flex-row gap-0">
              {/* Anime Banner Side */}
              <div className="hidden md:block w-1/3 relative bg-black border-r border-white/5">
                <Image 
                  src="/anime-edit.png"
                  alt="Edit Key Anime"
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-xl font-bold text-white mb-1">Recalibrate</h3>
                  <p className="text-xs text-white/60">Update limits and permissions for your connection.</p>
                </div>
              </div>

              {/* Form Side */}
              <div className="w-full md:w-2/3 p-6 sm:p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" />
                    Edit API Key
                  </DialogTitle>
                  <DialogDescription>
                    Update permissions, rate limit or rename this API key.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                {/* Key Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-key-name">Key Name</Label>
                  <Input
                    id="edit-key-name"
                    placeholder="e.g. Production API"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    autoFocus
                  />
                </div>

                {/* License Type */}
                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Select value={licenseType} onValueChange={setLicenseType}>
                    <SelectTrigger className="bg-white/5 border-white/10 w-full">
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

                {/* Max Devices */}
                <div className="space-y-2">
                  <Label htmlFor="edit-max-devices">Max Devices (HWID Locking)</Label>
                  <Input
                    id="edit-max-devices"
                    type="number"
                    min="1"
                    max="100"
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of devices allowed per key
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    placeholder="e.g. client-v2, enterprise, vip"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-white/5 border-white/10 font-mono-key"
                  />
                </div>

                {/* IP Whitelist */}
                <div className="space-y-2">
                  <Label htmlFor="edit-ips">IP Whitelist (comma-separated)</Label>
                  <Input
                    id="edit-ips"
                    placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
                    value={allowedIps}
                    onChange={(e) => setAllowedIps(e.target.value)}
                    className="bg-white/5 border-white/10 font-mono-key"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Internal Notes</Label>
                  <Input
                    id="edit-notes"
                    placeholder="Any internal notes about this key"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={isEditing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!name.trim() || isEditing}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium min-w-[120px]"
                  >
                    {isEditing ? (
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
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
