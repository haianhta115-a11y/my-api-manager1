"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldOff, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ApiKeyItem } from "./keys-table";

/* ─── Revoke Dialog ─── */
interface RevokeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyItem: ApiKeyItem | null;
  onRevoked: () => void;
}

export function RevokeDialog({
  open,
  onOpenChange,
  keyItem,
  onRevoked,
}: RevokeDialogProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!keyItem) return;
    setIsRevoking(true);
    try {
      const res = await fetch("/api/keys/revoke", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyItem.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke");
      toast.success("Key revoked", {
        description: `"${keyItem.name}" has been deactivated immediately.`,
      });
      onRevoked();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to revoke key", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md bg-card border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-amber-400" />
            Revoke API Key
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Are you sure you want to revoke{" "}
                <span className="text-foreground font-medium">
                  &quot;{keyItem?.name}&quot;
                </span>
                ?
              </p>
              <p className="text-muted-foreground">
                This will immediately disable the key. Any application using this
                key will receive authentication errors.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="bg-amber-600 hover:bg-amber-500 text-white font-medium"
          >
            {isRevoking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Revoke Key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─── Delete Dialog ─── */
interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyItem: ApiKeyItem | null;
  onDeleted: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  keyItem,
  onDeleted,
}: DeleteDialogProps) {
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = keyItem && confirmName.trim() === keyItem.name;

  const handleDelete = async () => {
    if (!keyItem || !isConfirmed) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/keys/${keyItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Key deleted", {
        description: `"${keyItem.name}" has been permanently removed.`,
      });
      onDeleted();
      onOpenChange(false);
      setConfirmName("");
    } catch (err) {
      toast.error("Failed to delete key", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setConfirmName("");
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md bg-card border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete API Key
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive/90">
                  This action <strong>cannot be undone</strong>. The key will be
                  permanently removed from the system.
                </p>
              </div>
              <p>
                Type{" "}
                <code className="font-mono-key text-xs bg-white/5 px-1.5 py-0.5 rounded text-foreground">
                  {keyItem?.name}
                </code>{" "}
                to confirm deletion:
              </p>
              <Input
                placeholder={keyItem?.name || "Enter key name"}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-destructive/50 focus:ring-destructive/20 font-mono-key"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="font-medium"
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Permanently
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}