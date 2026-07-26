"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Download, Check, Copy, Zap } from "lucide-react";
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

interface BulkKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function BulkKeyModal({
  open,
  onOpenChange,
  onCreated,
}: BulkKeyModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [amount, setAmount] = useState("10");
  const [prefix, setPrefix] = useState("VIP_");
  const [format, setFormat] = useState("random");
  const [licenseType, setLicenseType] = useState("lifetime");
  const [maxDevices, setMaxDevices] = useState("1");
  const [expiration, setExpiration] = useState("30d");
  const [generatedKeys, setGeneratedKeys] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setAmount("10");
    setPrefix("VIP_");
    setFormat("random");
    setLicenseType("lifetime");
    setMaxDevices("1");
    setExpiration("30d");
    setGeneratedKeys(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await fetch("/api/keys/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(amount) || 10,
          prefix,
          format,
          licenseType,
          maxDevices: parseInt(maxDevices) || 1,
          expiration,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk generation failed");

      setGeneratedKeys(data.plainKeys);
      toast.success(`Successfully generated ${data.count} keys!`);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk generate keys");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedKeys) return;
    const content = generatedKeys.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keys_export_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Keys exported to .TXT file!");
  };

  const handleCopyAll = async () => {
    if (!generatedKeys) return;
    await navigator.clipboard.writeText(generatedKeys.join("\n"));
    setCopied(true);
    toast.success("All keys copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) resetForm(); onOpenChange(val); }}>
      <DialogContent className="sm:max-w-2xl bg-black/90 border-emerald-500/30 backdrop-blur-xl text-white">
        {!generatedKeys ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-400 text-xl font-bold">
                <Layers className="w-5 h-5" />
                VIP Bulk Key Generator
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Generate batch license keys with custom format, prefixes, and HWID device binding rules.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Quantity (Max 100)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/5 border-white/10 text-emerald-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">Key Prefix</Label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. VIP_, PRO_, SUB_"
                  className="bg-white/5 border-white/10 text-emerald-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-white/80">License Type</Label>
                <Select value={licenseType} onValueChange={setLicenseType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-xs">
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
                <Label className="text-xs text-white/80">Max HWID Devices</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={maxDevices}
                  onChange={(e) => setMaxDevices(e.target.value)}
                  className="bg-white/5 border-white/10 font-mono text-emerald-400 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-white/80">Expiration (Thời hạn)</Label>
                <Select value={expiration} onValueChange={setExpiration}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 max-h-56 overflow-y-auto">
                    <SelectItem value="1h">1 Giờ (1 hour)</SelectItem>
                    <SelectItem value="6h">6 Giờ (6 hours)</SelectItem>
                    <SelectItem value="12h">12 Giờ (12 hours)</SelectItem>
                    <SelectItem value="24h">24 Giờ (1 ngày)</SelectItem>
                    <SelectItem value="3d">3 Ngày (3 days)</SelectItem>
                    <SelectItem value="7d">7 Ngày (7 days)</SelectItem>
                    <SelectItem value="30d">30 Ngày (1 tháng)</SelectItem>
                    <SelectItem value="90d">90 Ngày (3 tháng)</SelectItem>
                    <SelectItem value="365d">365 Ngày (1 năm)</SelectItem>
                    <SelectItem value="never">Vĩnh viễn (Never Expires)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
              >
                {isGenerating ? "Generating Keys..." : `Generate ${amount} Keys`}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-400 text-xl font-bold">
                <Zap className="w-5 h-5" />
                Generated {generatedKeys.length} Batch Keys
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Batch creation complete. Download or copy the keys below.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-black/60 border border-white/10 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs text-emerald-400 space-y-1">
              {generatedKeys.map((k, idx) => (
                <div key={idx} className="hover:bg-white/5 p-1 rounded">
                  {k}
                </div>
              ))}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCopyAll}
                className="border-white/10 text-white hover:bg-white/10"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied All" : "Copy All"}
              </Button>
              <Button
                onClick={handleDownloadTxt}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Export .TXT File
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
