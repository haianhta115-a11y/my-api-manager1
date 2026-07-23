"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Cpu,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Zap,
  Radio,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import crypto from "crypto";

export function SecurityInspectorView() {
  const [testKey, setTestKey] = useState("sk_live_CyberGuardian99882211");
  const [testHwid, setHwid] = useState("HWID-WIN11-PRO-DESKTOP-901");
  const [secretKey, setSecretKey] = useState("VIP_KEY_SERVER_SUPER_SECRET_SIGNATURE_KEY_2026");
  const [copied, setCopied] = useState(false);

  const timestamp = Date.now();
  const rawPayload = `${testKey}:${testHwid}:${timestamp}:VALID`;
  const signature = crypto
    .createHmac("sha256", secretKey || "SECRET")
    .update(rawPayload)
    .digest("hex");

  const copySignature = () => {
    navigator.clipboard.writeText(signature);
    setCopied(true);
    toast.success("HMAC-SHA256 Digital Signature copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass rounded-2xl p-6 border border-purple-500/20 bg-gradient-to-r from-purple-950/30 via-black/80 to-emerald-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs mb-1 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Cryptographic Security & HMAC Protection Engine</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-white">
              Digital Signature & Anti-Tamper Inspector
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Inspect cryptographic response signatures (HMAC-SHA256), test host-file bypass protections, and verify anti-crack licensing payload protection for desktop software.
            </p>
          </div>

          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono text-xs px-3 py-1 gap-1.5 self-start md:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            HMAC-SHA256 Enabled
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Signature Generator */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Live Cryptographic Signature Generator
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Target License Key</Label>
              <Input
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                className="bg-black/50 border-white/10 font-mono text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Client Hardware ID (HWID)</Label>
              <Input
                value={testHwid}
                onChange={(e) => setHwid(e.target.value)}
                className="bg-black/50 border-white/10 font-mono text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Signing Secret Key (Server Private Secret)</Label>
              <Input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="bg-black/50 border-white/10 font-mono text-xs mt-1"
              />
            </div>
          </div>

          {/* Generated Signature Box */}
          <div className="p-4 rounded-xl bg-black/80 border border-emerald-500/30 space-y-2 relative">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Generated HMAC Signature:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copySignature}
                className="h-6 text-[10px] text-emerald-400 hover:bg-emerald-500/10 gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy Hex"}
              </Button>
            </div>
            <code className="font-mono text-xs text-emerald-300 break-all block p-2 bg-emerald-950/30 rounded border border-emerald-500/20">
              {signature}
            </code>
          </div>
        </div>

        {/* Right Column: Integration Guidance */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              Anti-Cracking Signature Verification Code
            </h4>
          </div>

          <p className="text-xs text-muted-foreground">
            Include this verification check inside your C# / C++ application to verify that server responses were signed by API Guardian Pro and not tampered by a local proxy / hosts bypass.
          </p>

          <div className="p-4 rounded-xl bg-black/90 border border-white/10 font-mono text-xs text-sky-200/90 leading-relaxed overflow-x-auto">
            <pre>{`// C# Anti-Bypass Signature Check
public static bool IsSignatureValid(string responseBody, string signature, string secret) {
    using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret))) {
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(responseBody));
        string computedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();
        return computedSignature.Equals(signature, StringComparison.OrdinalIgnoreCase);
    }
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
