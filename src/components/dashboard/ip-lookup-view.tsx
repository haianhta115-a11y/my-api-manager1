"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Wifi,
  Cpu,
  RefreshCw,
  Zap,
  Radio,
  Server,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface IpDetails {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  isVpn: boolean;
  isProxy: boolean;
  threatScore: number; // 0 - 100
  status: "safe" | "warning" | "dangerous";
  latitude: number;
  longitude: number;
  activeKeys: number;
}

export function IpLookupView() {
  const [queryIp, setQueryIp] = useState("103.142.140.22");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IpDetails | null>({
    ip: "103.142.140.22",
    country: "Vietnam",
    countryCode: "VN",
    region: "Hanoi",
    city: "Hanoi Capital",
    isp: "VNPT Telecom Corporation",
    isVpn: false,
    isProxy: false,
    threatScore: 8,
    status: "safe",
    latitude: 21.0285,
    longitude: 105.8542,
    activeKeys: 3,
  });

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryIp.trim()) {
      toast.error("Please enter a valid IP address");
      return;
    }

    setLoading(true);
    try {
      // Simulate real-time Geo-IP & Threat Intelligence lookup
      await new Promise((r) => setTimeout(r, 600));

      const isLocal = queryIp === "127.0.0.1" || queryIp === "localhost";
      const mockThreatScore = isLocal ? 0 : Math.floor(Math.random() * 25);

      setResult({
        ip: queryIp.trim(),
        country: isLocal ? "Local Machine" : "Vietnam",
        countryCode: isLocal ? "LOCAL" : "VN",
        region: isLocal ? "Internal System" : "Ho Chi Minh City",
        city: isLocal ? "Localhost" : "District 1",
        isp: isLocal ? "Loopback Adapter" : "Viettel Military Telecom",
        isVpn: false,
        isProxy: false,
        threatScore: mockThreatScore,
        status: mockThreatScore > 50 ? "dangerous" : mockThreatScore > 20 ? "warning" : "safe",
        latitude: 10.8231,
        longitude: 106.6297,
        activeKeys: Math.floor(Math.random() * 5) + 1,
      });

      toast.success(`Lookup completed for ${queryIp}`);
    } catch (err) {
      toast.error("IP lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-black/80 to-sky-950/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs mb-1 uppercase tracking-widest">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Geo-IP & Device Threat Intelligence Radar</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-white">
              Device IP & Hardware Security Lookup
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Analyze incoming device IPs, verify geographical coordinates, detect VPN/Proxy bypass attempts, and calculate real-time threat scores for active license keys.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-xs px-3 py-1 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Threat Engine Active
            </Badge>
          </div>
        </div>

        {/* Decorative Grid Line Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* IP Lookup Search Bar */}
      <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <Input
              placeholder="Enter IP address (e.g. 103.142.140.22 or 127.0.0.1)..."
              value={queryIp}
              onChange={(e) => setQueryIp(e.target.value)}
              className="pl-10 h-11 bg-black/50 border-white/10 text-xs font-mono text-white placeholder:text-white/40 focus:border-emerald-500/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-6 shadow-[0_0_20px_rgba(16,185,129,0.4)] btn-shimmer gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? "Scanning IP..." : "Lookup Threat Data"}
          </Button>
        </form>
      </div>

      {/* Lookup Result Dashboard */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Info Card */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold font-mono text-white">{result.ip}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {result.city}, {result.region}, {result.country}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs px-3 py-1 font-bold ${
                  result.status === "safe"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : result.status === "warning"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-destructive/20 text-destructive border-destructive/30"
                }`}
              >
                {result.status.toUpperCase()}
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Server className="w-3 h-3 text-purple-400" /> Telecom / ISP
                </span>
                <p className="text-xs font-semibold text-white truncate">{result.isp}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-sky-400" /> VPN / Proxy Detection
                </span>
                <p className="text-xs font-semibold text-emerald-400">
                  {result.isVpn ? "VPN Detected" : "Direct IP (Clean)"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-amber-400" /> Linked Keys
                </span>
                <p className="text-xs font-semibold text-white">{result.activeKeys} Active License(s)</p>
              </div>
            </div>

            {/* Simulated Live World Coordinates radar visual */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono flex items-center gap-1.5 text-emerald-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Geo Coordinates: {result.latitude}, {result.longitude}
                </span>
                <span className="font-mono text-[10px]">Ping Latency: 18ms</span>
              </div>
              <div className="h-24 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center relative">
                <div className="w-16 h-16 rounded-full border border-emerald-500/40 animate-ping absolute" />
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]" />
                <span className="absolute bottom-2 left-3 font-mono text-[10px] text-emerald-400/80">
                  RADAR SCANNING: {result.country} Edge Node
                </span>
              </div>
            </div>
          </div>

          {/* Threat Meter Sidebar */}
          <div className="glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Security Threat Assessment Score
              </h4>
              <p className="text-xs text-muted-foreground">
                Calculated based on IP reputation, blacklists, and historical access anomalies.
              </p>
            </div>

            {/* Gauge Display */}
            <div className="flex flex-col items-center justify-center py-6 relative">
              <div className="w-36 h-36 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <span className="text-4xl font-extrabold font-mono text-emerald-400">
                  {result.threatScore}%
                </span>
                <span className="text-[10px] uppercase font-mono text-muted-foreground mt-1">
                  Risk Level
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Botnet Blacklist:</span>
                <span className="text-emerald-400 font-bold">Passed (Clean)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tor Exit Node:</span>
                <span className="text-emerald-400 font-bold">Negative</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Brute Force Alerts:</span>
                <span className="text-emerald-400 font-bold">0 Incidents</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success(`IP ${result.ip} added to whitelist rules!`);
              }}
              className="w-full bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Whitelist This IP Address
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
