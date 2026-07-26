"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ShieldAlert, Code2, Terminal, Cpu, Lock, Download } from "lucide-react";
import { toast } from "sonner";

interface SdkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SdkModal({ open, onOpenChange }: SdkModalProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const handleCopy = (code: string, tabName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(tabName);
    toast.success(`Đã sao chép mã nguồn ${tabName}!`);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const cppCode = `// ============================================================================
// API GUARDIAN PRO - NATIVE C++ ANTI-CRACK & LICENSE AUTHENTICATION SDK
// Target Endpoint: https://my-api-manager.vercel.app/api/v1/license/verify
// ============================================================================
#include <iostream>
#include <windows.h>
#include <winhttp.h>
#include <iphlpapi.h>
#include <intrin.h>
#include <sstream>
#include <iomanip>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "iphlpapi.lib")

// ----------------------------------------------------------------------------
// 1. ANTI-DEBUGGING & ANTI-TAMPERING (C++ NATIVE)
// ----------------------------------------------------------------------------
bool AntiDebugCheck() {
    // Check 1: WinAPI IsDebuggerPresent
    if (IsDebuggerPresent()) return true;

    // Check 2: CheckRemoteDebuggerPresent
    BOOL isDebuggerPresent = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &isDebuggerPresent);
    if (isDebuggerPresent) return true;

    // Check 3: Direct PEB BeingDebugged Flag Inspection
#if defined(_WIN64)
    BYTE* peb = (BYTE*)__readgsqword(0x60);
#else
    BYTE* peb = (BYTE*)__readfsdword(0x30);
#endif
    if (peb && peb[2] != 0) return true; // PEB->BeingDebugged != 0

    return false;
}

// ----------------------------------------------------------------------------
// 2. HARDWARE ID (HWID) GENERATOR
// ----------------------------------------------------------------------------
std::string GetSystemHWID() {
    HW_PROFILE_INFOA hwProfileInfo;
    if (GetCurrentHwProfileA(&hwProfileInfo)) {
        return std::string(hwProfileInfo.szHwProfileGuid);
    }
    return "HWID_FALLBACK_DEFAULT_0000";
}

// ----------------------------------------------------------------------------
// 3. LICENSE VERIFICATION HTTP POST REQUEST
// ----------------------------------------------------------------------------
struct LicenseResult {
    bool valid;
    std::string code;
    std::string message;
    std::string expiresAt;
    int boundDevices;
    int maxDevices;
};

LicenseResult VerifyLicenseKey(const std::string& key) {
    LicenseResult res = { false, "UNKNOWN_ERROR", "Internal execution error", "", 0, 0 };

    if (AntiDebugCheck()) {
        res.code = "CHEAT_DETECTED";
        res.message = "Phát hiện công cụ Debugger/Cheat Engine! Tiến trình sẽ bị hủy.";
        return res;
    }

    std::string hwid = GetSystemHWID();
    std::string domain = L"my-api-manager.vercel.app";
    std::string path = "/api/v1/license/verify";

    // Build JSON Payload
    std::string jsonPayload = "{\\"key\\":\\"" + key + "\\",\\"hwid\\":\\"" + hwid + "\\",\\"app_name\\":\\"NativeCppApp\\"}";

    HINTERNET hSession = WinHttpOpen(L"API-Guardian-Native-SDK/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) return res;

    HINTERNET hConnect = WinHttpConnect(hSession, L"my-api-manager.vercel.app", INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return res; }

    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", L"/api/v1/license/verify", NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
    if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return res; }

    LPCWSTR headers = L"Content-Type: application/json\\r\\n";
    BOOL bSend = WinHttpSendRequest(hRequest, headers, -1L, (LPVOID)jsonPayload.c_str(), (DWORD)jsonPayload.length(), (DWORD)jsonPayload.length(), 0);

    if (bSend && WinHttpReceiveResponse(hRequest, NULL)) {
        DWORD dwSize = 0;
        std::string responseText = "";
        do {
            dwSize = 0;
            WinHttpQueryDataAvailable(hRequest, &dwSize);
            if (dwSize > 0) {
                char* buf = new char[dwSize + 1];
                DWORD dwRead = 0;
                WinHttpReadData(hRequest, (LPVOID)buf, dwSize, &dwRead);
                buf[dwRead] = 0;
                responseText += buf;
                delete[] buf;
            }
        } while (dwSize > 0);

        // Simple JSON Parsing Demonstration
        if (responseText.find("\\"valid\\":true") != std::string::npos) {
            res.valid = true;
            res.code = "SUCCESS";
            res.message = "License key hop le! Dang nhap thanh cong.";
        } else if (responseText.find("KEY_EXPIRED") != std::string::npos) {
            res.code = "KEY_EXPIRED";
            res.message = "Key da HET HAN su dung! Vui long gia han key.";
        } else if (responseText.find("KEY_LOCKED") != std::string::npos || responseText.find("KEY_REVOKED") != std::string::npos) {
            res.code = "KEY_REVOKED";
            res.message = "Key da bi KHOA hoac THU HOI boi Admin!";
        } else if (responseText.find("HWID_LIMIT_EXCEEDED") != std::string::npos) {
            res.code = "HWID_LIMIT_EXCEEDED";
            res.message = "Vuot qua so luong thiet bi cho phep (Vuot quat HWID Limit)!";
        } else if (responseText.find("USER_BLOCKED") != std::string::npos || responseText.find("IP_BLOCKED") != std::string::npos) {
            res.code = "BLOCKED";
            res.message = "Tai khoan nguoi tao hoac IP cua ban da bi BAND vinh vien.";
        } else {
            res.message = "Key khong ton tai hoac sai cu phap!";
        }
    }

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return res;
}

int main() {
    std::cout << "=== CLIENT LOGIN & KEY AUTHENTICATION APP (C++ NATIVE) ===" << std::endl;

    if (AntiDebugCheck()) {
        std::cout << "[ERROR] Phat hien Crack/Debugger! Ung dung dang thoat..." << std::endl;
        Sleep(2000);
        return -1;
    }

    std::string inputKey;
    std::cout << "Nhap API Key de dang nhap: ";
    std::cin >> inputKey;

    std::cout << "\\r\\n[+] Dang ket noi den Server https://my-api-manager.vercel.app để kiem tra key..." << std::endl;
    LicenseResult result = VerifyLicenseKey(inputKey);

    if (result.valid) {
        std::cout << "[SUCCESS] " << result.message << std::endl;
        std::cout << "[+] HWID Cua Ban: " << GetSystemHWID() << std::endl;
        // Chay chuong trinh chinh o day...
    } else {
        std::cout << "[FAILED] LOI DANG NHAP: " << result.message << " (Code: " << result.code << ")" << std::endl;
    }

    system("pause");
    return 0;
}
`;

  const csharpCode = `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ApiManagerClient
{
    public class LicenseVerificationService
    {
        private static readonly HttpClient client = new HttpClient();
        private const string VERIFY_URL = "https://my-api-manager.vercel.app/api/v1/license/verify";

        public static async Task Main(string[] args)
        {
            Console.Title = "Client Key Verification App (C# .NET)";
            Console.WriteLine("==================================================");
            Console.WriteLine("        CLIENT LOGIN & KEY CHECKER APP           ");
            Console.WriteLine("==================================================");

            Console.Write("Nhập API License Key của bạn: ");
            string key = Console.ReadLine()?.Trim();

            string hwid = System.Environment.MachineName + "_" + System.Environment.UserName;

            var payload = new
            {
                key = key,
                hwid = hwid,
                app_name = "CSharpDesktopClient",
                client_version = "1.0.0"
            };

            try
            {
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                HttpResponseMessage response = await client.PostAsync(VERIFY_URL, content);
                string jsonResult = await response.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(jsonResult);
                var root = doc.RootElement;
                bool valid = root.GetProperty("valid").GetBoolean();
                string code = root.GetProperty("code").GetString();
                string message = root.GetProperty("message").GetString();

                if (valid)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"\\n[SUCCESS] Đăng Nhập Thành Công! {message}");
                    if (root.TryGetProperty("license", out var lic))
                    {
                        Console.WriteLine($"Plan: {lic.GetProperty("type").GetString()}");
                        Console.WriteLine($"Ngày Hết Hạn: {lic.GetProperty("expiresAt").GetString() ?? "Vĩnh viễn (Never)"}");
                        Console.WriteLine($"Số Thiết Bị: {lic.GetProperty("boundDevices").GetInt32()}/{lic.GetProperty("maxDevices").GetInt32()}");
                    }
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"\\n[LỖI ĐĂNG NHẬP] {message} (Mã lỗi: {code})");
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"\\n[LỖI MẠNG] Không thể kết nối Server API: {ex.Message}");
            }

            Console.ResetColor();
            Console.WriteLine("\\nNhấn phím bất kỳ để thoát...");
            Console.ReadKey();
        }
    }
}
`;

  const pythonCode = `import requests
import platform
import sys

VERIFY_URL = "https://my-api-manager.vercel.app/api/v1/license/verify"

def get_hwid():
    return f"{platform.node()}_{platform.processor()}_{platform.machine()}"

def check_license(api_key):
    hwid = get_hwid()
    payload = {
        "key": api_key.strip(),
        "hwid": hwid,
        "app_name": "PythonClientApp",
        "client_version": "1.0.0"
    }

    try:
        response = requests.post(VERIFY_URL, json=payload, timeout=10)
        data = response.json()
        return data
    except Exception as e:
        return {"valid": False, "code": "NETWORK_ERROR", "message": str(e)}

if __name__ == "__main__":
    print("=== PYTHON CLIENT LOGIN & KEY CHECKER ===")
    user_key = input("Nhập API Key: ").strip()

    print("[+] Đang kiểm tra bản quyền key với Server...")
    result = check_license(user_key)

    if result.get("valid"):
        print(f"\\n✅ ĐĂNG NHẬP THÀNH CÔNG!")
        print(f"Lời nhắn: {result.get('message')}")
        lic = result.get("license", {})
        print(f"Loại Key: {lic.get('type')}")
        print(f"Ngày Hết Hạn: {lic.get('expiresAt') or 'Never (Vĩnh viễn)'}")
    else:
        print(f"\\n❌ ĐĂNG NHẬP THẤT BẠI: {result.get('message')}")
        print(f"Mã Lỗi: {result.get('code')}")
`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-white/10 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
            <Code2 className="w-6 h-6 text-emerald-400" />
            Tích Hợp Client SDK & Native Anti-Crack C++
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Mã nguồn mẫu kết nối API Server <code className="text-emerald-400 font-mono">https://my-api-manager.vercel.app/api/v1/license/verify</code> tích hợp kiểm tra Anti-Debugger & HWID.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cpp" className="w-full mt-2 space-y-4">
          <TabsList className="bg-white/5 border border-white/10 grid grid-cols-3">
            <TabsTrigger value="cpp" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-xs font-bold gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Native C++ (Anti-Crack)
            </TabsTrigger>
            <TabsTrigger value="csharp" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-xs font-bold gap-1.5">
              <Lock className="w-4 h-4 text-purple-400" />
              C# .NET GUI
            </TabsTrigger>
            <TabsTrigger value="python" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400 text-xs font-bold gap-1.5">
              <Terminal className="w-4 h-4 text-sky-400" />
              Python Script
            </TabsTrigger>
          </TabsList>

          {/* C++ Native Tab */}
          <TabsContent value="cpp" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  C++ Native (WinAPI + Anti-Debug)
                </Badge>
                <span className="text-xs text-muted-foreground">Bao gồm PEB inspection, IsDebuggerPresent, HWID & HTTP WinHTTP</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(cppCode, "C++ Native")}
                className="h-8 text-xs bg-white/5 border-white/10 hover:bg-emerald-500/20 gap-1.5 text-emerald-400 font-bold"
              >
                {copiedTab === "C++ Native" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Mã C++
              </Button>
            </div>

            <pre className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] leading-relaxed text-emerald-300 overflow-x-auto max-h-[400px]">
              {cppCode}
            </pre>
          </TabsContent>

          {/* C# Tab */}
          <TabsContent value="csharp" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                  C# .NET Application
                </Badge>
                <span className="text-xs text-muted-foreground">Xác thực HttpClient, parse JSON và kiểm tra ngày hết hạn</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(csharpCode, "C# .NET")}
                className="h-8 text-xs bg-white/5 border-white/10 hover:bg-purple-500/20 gap-1.5 text-purple-400 font-bold"
              >
                {copiedTab === "C# .NET" ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Mã C#
              </Button>
            </div>

            <pre className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] leading-relaxed text-purple-300 overflow-x-auto max-h-[400px]">
              {csharpCode}
            </pre>
          </TabsContent>

          {/* Python Tab */}
          <TabsContent value="python" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-xs">
                  Python Request Client
                </Badge>
                <span className="text-xs text-muted-foreground">Kết nối siêu nhẹ bằng thư viện requests</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(pythonCode, "Python")}
                className="h-8 text-xs bg-white/5 border-white/10 hover:bg-sky-500/20 gap-1.5 text-sky-400 font-bold"
              >
                {copiedTab === "Python" ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Mã Python
              </Button>
            </div>

            <pre className="p-4 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] leading-relaxed text-sky-300 overflow-x-auto max-h-[400px]">
              {pythonCode}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
