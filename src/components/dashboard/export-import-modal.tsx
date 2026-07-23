"use client";

import { useState } from "react";
import { Download, Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ExportImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ExportImportModal({ open, onOpenChange, onImportComplete }: ExportImportModalProps) {
  const [importJson, setImportJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleExportCsv = () => {
    window.open("/api/keys/export?format=csv", "_blank");
    toast.success("CSV Export started!");
  };

  const handleExportJson = () => {
    window.open("/api/keys/export?format=json", "_blank");
    toast.success("JSON Backup started!");
  };

  const handleImportSubmit = async () => {
    if (!importJson.trim()) {
      toast.error("Please paste JSON data to import");
      return;
    }

    let parsedItems = [];
    try {
      parsedItems = JSON.parse(importJson.trim());
      if (!Array.isArray(parsedItems)) {
        if (typeof parsedItems === "object" && Array.isArray((parsedItems as { keys?: unknown[] }).keys)) {
          parsedItems = (parsedItems as { keys: unknown[] }).keys;
        } else {
          parsedItems = [parsedItems];
        }
      }
    } catch {
      toast.error("Invalid JSON format. Please check your syntax.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/keys/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to import keys");
      toast.success(`Successfully imported ${json.importedCount} API keys!`);
      setImportJson("");
      onOpenChange(false);
      onImportComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            Data Backup, Export & Bulk Import
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Export Section */}
          <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Export Key Backups
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleExportCsv}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Export to CSV
              </Button>
              <Button
                onClick={handleExportJson}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs gap-2"
              >
                <Download className="w-4 h-4 text-sky-400" />
                Export to JSON
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bulk Import Keys (JSON)
            </h4>
            <div>
              <Label className="text-xs text-muted-foreground">Paste JSON Array of Key Objects</Label>
              <Textarea
                placeholder='[{"name": "Client Key 1", "environment": "production", "maxDevices": 2}]'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={5}
                className="bg-white/5 border-white/10 font-mono text-xs mt-1.5"
              />
            </div>
            <Button
              onClick={handleImportSubmit}
              disabled={isImporting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importing Keys..." : "Execute Bulk Import"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
