"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Copy, Check, Terminal, Code, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function SdkSandboxView() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [hwidInput, setHwidInput] = useState("HWID-DESKTOP-99A82B");
  const [appName, setAppName] = useState("MyClientApp");
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<Record<string, unknown> | null>(null);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const handleTestVerify = async () => {
    if (!apiKeyInput) {
      toast.error("Please enter an API Key to test");
      return;
    }
    setIsLoading(true);
    setResponseResult(null);

    try {
      const res = await fetch("/api/v1/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: apiKeyInput.trim(),
          hwid: hwidInput.trim(),
          app_name: appName,
          client_version: "2.1.0",
        }),
      });

      const json = await res.json();
      setResponseResult({ status: res.status, ok: res.ok, body: json });
      if (res.ok && json.valid) {
        toast.success("License Verified Successfully!");
      } else {
        toast.error(`Verification Failed: ${json.message || "Invalid Key"}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const codeSnippets: Record<string, string> = {
    csharp: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class LicenseVerifier
{
    private static readonly string API_URL = "http://localhost:3000/api/v1/license/verify";

    public static async Task<bool> VerifyLicenseAsync(string apiKey, string hwid)
    {
        using var client = new HttpClient();
        var payload = new
        {
            key = apiKey,
            hwid = hwid,
            app_name = "WPF_WinForms_Client",
            client_version = "1.0.0"
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(API_URL, content);
        var jsonResponse = await response.Content.ReadAsStringAsync();

        Console.WriteLine($"Server Response: {jsonResponse}");
        return response.IsSuccessStatusCode;
    }
}`,
    cpp: `#include <iostream>
#include <winhttp.h>

// C++ WinAPI HTTP License Verification Example
bool VerifyLicense(const std::string& apiKey, const std::string& hwid) {
    HINTERNET hSession = WinHttpOpen(L"LicenseClient/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0);
    if (!hSession) return false;

    HINTERNET hConnect = WinHttpConnect(hSession, L"localhost", 3000, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return false; }

    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", L"/api/v1/license/verify", NULL, NULL, NULL, 0);
    
    std::string payload = "{\\"key\\":\\"" + apiKey + "\\",\\"hwid\\":\\"" + hwid + "\\"}";
    std::wstring headers = L"Content-Type: application/json\\r\\n";

    BOOL bResults = WinHttpSendRequest(hRequest, headers.c_str(), -1, (LPVOID)payload.c_str(), payload.length(), payload.length(), 0);
    if (bResults) bResults = WinHttpReceiveResponse(hRequest, NULL);

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return bResults;
}`,
    python: `import requests

API_URL = "http://localhost:3000/api/v1/license/verify"

def check_license(api_key: str, hwid: str) -> bool:
    payload = {
        "key": api_key,
        "hwid": hwid,
        "app_name": "PythonDesktopApp",
        "client_version": "1.0.0"
    }
    response = requests.post(API_URL, json=payload)
    data = response.json()
    
    if response.status_code == 200 and data.get("valid"):
        print("License Validated! Expire:", data.get("license", {}).get("expiresAt"))
        return True
    else:
        print("License Rejected:", data.get("message"))
        return False`,
    nodejs: `import fetch from 'node-fetch';

async function verifyLicense(apiKey, hwid) {
  const response = await fetch('http://localhost:3000/api/v1/license/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: apiKey,
      hwid: hwid,
      app_name: 'NodeClient',
      client_version: '1.0.0'
    })
  });

  const data = await response.json();
  return data;
}`,
    curl: `curl -X POST http://localhost:3000/api/v1/license/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "${apiKeyInput || "sk_live_YOUR_KEY_HERE"}",
    "hwid": "${hwidInput || "HWID-TEST-12345"}",
    "app_name": "CurlTestApp"
  }'`,
  };

  const copyCode = (lang: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedLang(lang);
    toast.success("Code snippet copied!");
    setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            API Interactive Sandbox & SDK Generator
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Test live license verification requests and generate client integration code for C#, C++, Python, Node.js, and cURL.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Tester */}
        <div className="glass rounded-xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Play className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold">Live Verification Endpoint Sandbox</h4>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">API Key (sk_live_... / sk_test_...)</Label>
              <Input
                placeholder="Paste API key here..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Hardware ID (HWID)</Label>
              <Input
                placeholder="HWID-12345"
                value={hwidInput}
                onChange={(e) => setHwidInput(e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">App Name</Label>
              <Input
                placeholder="MyDesktopApp"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-white/5 border-white/10 text-xs mt-1"
              />
            </div>

            <Button
              onClick={handleTestVerify}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              {isLoading ? "Verifying..." : "Execute Verification Request"}
            </Button>
          </div>

          {/* Response Inspector */}
          {responseResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-black/70 border border-white/10 rounded-lg font-mono text-xs space-y-2"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-muted-foreground">Response Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    responseResult.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"
                  }`}
                >
                  HTTP {String(responseResult.status)}
                </span>
              </div>
              <pre className="text-emerald-300/90 overflow-x-auto max-h-48 scrollbar-thin">
                {JSON.stringify(responseResult.body, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>

        {/* Right Column: Code Snippet Generator */}
        <div className="glass rounded-xl p-5 border border-white/5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-semibold">Client Integration SDK Snippets</h4>
            </div>
          </div>

          <Tabs defaultValue="csharp" className="w-full flex-1 flex flex-col">
            <TabsList className="bg-white/5 border border-white/10 p-0.5 h-8">
              <TabsTrigger value="csharp" className="text-xs px-2.5 py-1">C# (.NET)</TabsTrigger>
              <TabsTrigger value="cpp" className="text-xs px-2.5 py-1">C++</TabsTrigger>
              <TabsTrigger value="python" className="text-xs px-2.5 py-1">Python</TabsTrigger>
              <TabsTrigger value="nodejs" className="text-xs px-2.5 py-1">Node.js</TabsTrigger>
              <TabsTrigger value="curl" className="text-xs px-2.5 py-1">cURL</TabsTrigger>
            </TabsList>

            {Object.entries(codeSnippets).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="mt-3 flex-1 flex flex-col relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(lang, code)}
                    className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white gap-1"
                  >
                    {copiedLang === lang ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedLang === lang ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="bg-black/80 border border-white/10 rounded-lg p-4 font-mono text-xs overflow-x-auto flex-1 text-sky-200/90 leading-relaxed">
                  <pre>{code}</pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
