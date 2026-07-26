"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Monitor, Clock, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function ClientSimulator() {
  const [keyInput, setKeyInput] = useState("");
  const [hwidInput, setHwidInput] = useState("HWID_WIN11_DESKTOP_PRO_88492");
  const [appName, setAppName] = useState("MyVipApp_Client_v2.0");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      toast.error("Vui lòng nhập API Key để kiểm tra!");
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: keyInput.trim(),
          hwid: hwidInput.trim(),
          app_name: appName,
          client_version: "2.1.0",
        }),
      });

      const json = await res.json();
      setResult({ status: res.status, data: json });

      if (json.valid) {
        toast.success("✅ ĐĂNG NHẬP THÀNH CÔNG! Key hợp lệ.");
      } else {
        toast.error(`❌ ĐĂNG NHẬP THẤT BẠI: ${json.message || "Lỗi kiểm tra key"}`);
      }
    } catch (err) {
      toast.error("Không thể kết nối đến Server API!");
      setResult({ status: 500, data: { valid: false, code: "NETWORK_ERROR", message: "Kết nối thất bại" } });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 border border-white/10 space-y-6 bg-gradient-to-br from-zinc-950 via-black to-emerald-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-400" />
            Giả Lập App Client Đăng Nhập & Anti-Crack API Check
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test thử quy trình ứng dụng Native/Client kết nối đến Endpoint <code className="text-emerald-400 font-mono">/api/v1/license/verify</code>
          </p>
        </div>

        <Badge className="bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-mono text-xs w-fit">
          API Status: Online (200 OK)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Client Login Form */}
        <form onSubmit={handleVerify} className="space-y-4 p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="space-y-1.5">
            <Label className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              API License Key Cần Check *
            </Label>
            <Input
              placeholder="Dán mã API Key (Ví dụ: sk_live_...)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="bg-black/60 border-white/10 text-xs font-mono text-emerald-300 h-10"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Hardware ID (HWID Device)
              </Label>
              <Input
                value={hwidInput}
                onChange={(e) => setHwidInput(e.target.value)}
                className="bg-black/60 border-white/10 text-xs font-mono text-sky-300 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Tên Ứng Dụng (App Name)
              </Label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-black/60 border-white/10 text-xs font-mono text-purple-300 h-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isVerifying || !keyInput.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 shadow-lg shadow-emerald-500/20 gap-2 mt-2"
          >
            {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isVerifying ? "Đang Kết Nối API..." : "Giả Lập Đăng Nhập Client"}
          </Button>
        </form>

        {/* Right Panel: Server Response Inspection */}
        <div className="p-5 rounded-xl bg-black/80 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Kết Quả Trả Về Từ Server (JSON Response)
            </span>
            {result && (
              <Badge
                className={`text-[10px] font-mono font-bold ${
                  result.data?.valid
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-destructive/20 text-destructive border-destructive/40"
                }`}
              >
                HTTP {result.status} {result.data?.code}
              </Badge>
            )}
          </div>

          {result ? (
            <div className="space-y-3">
              {/* Alert Status Banner */}
              <div
                className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                  result.data?.valid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {result.data?.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span>{result.data?.message}</span>
              </div>

              {/* Detailed Attributes */}
              {result.data?.valid && result.data?.license && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/5 p-3 rounded-lg border border-white/10">
                  <div><span className="text-muted-foreground">License Type:</span> <span className="text-amber-400 font-bold uppercase">{result.data.license.type}</span></div>
                  <div><span className="text-muted-foreground">Devices:</span> <span className="text-emerald-400 font-bold">{result.data.license.boundDevices}/{result.data.license.maxDevices}</span></div>
                  <div><span className="text-muted-foreground">Expires At:</span> <span className="text-sky-400">{result.data.license.expiresAt ? new Date(result.data.license.expiresAt).toLocaleString() : "Never"}</span></div>
                  <div><span className="text-muted-foreground">Permissions:</span> <span className="text-purple-400">{result.data.license.permissions}</span></div>
                </div>
              )}

              {/* Raw JSON Code view */}
              <pre className="p-3 rounded-lg bg-zinc-950 border border-white/10 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-[160px]">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <Monitor className="w-8 h-8 text-white/20 mx-auto" />
              <p>Nhập API Key ở cột bên trái và bấm nút <span className="text-emerald-400 font-semibold">Giả Lập Đăng Nhập Client</span> để xem phản hồi thực tế từ Server.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
