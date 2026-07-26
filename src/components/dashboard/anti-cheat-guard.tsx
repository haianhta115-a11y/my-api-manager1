"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AntiCheatGuard() {
  const { data: session } = useSession();
  const [cheatDetected, setCheatDetected] = useState(false);
  const [cheatReason, setCheatReason] = useState("");

  const isAdmin =
    (session?.user as any)?.role === "admin" || session?.user?.email === "hjk@admin.com";

  useEffect(() => {
    // Disable right click (Context Menu) for all users
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerCheatWarning("Vô hiệu hóa Chuột Phải / Context Menu");
    };

    // Disable DevTools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12") {
        e.preventDefault();
        triggerCheatWarning("Sử dụng phím F12 (DevTools)");
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key)
      ) {
        e.preventDefault();
        triggerCheatWarning("Sử dụng phím tắt Mở DevTools / Inspect");
      }
      if ((e.ctrlKey || e.metaKey) && ["U", "u", "S", "s"].includes(e.key)) {
        e.preventDefault();
        triggerCheatWarning("Sử dụng phím tắt Xem Nguồn Trang (View Source)");
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    // DevTools Resize / Detector
    let devtoolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if ((widthDiff || heightDiff) && !devtoolsOpen) {
        devtoolsOpen = true;
        triggerCheatWarning("Phát hiện mở cửa sổ Kiểm Tra Phần Tử (DevTools)");
      }
    };

    const interval = setInterval(checkDevTools, 1500);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, [session, isAdmin]);

  const triggerCheatWarning = async (reason: string) => {
    // If Admin: show notification/warning, but NEVER BAN Admin
    if (isAdmin) {
      console.warn(`[ADMIN SECURITY NOTICE] DevTools/Inspect activity detected: ${reason}`);
      return;
    }

    // If Normal User: Mark as cheated, report to server, and BAN account!
    setCheatReason(reason);
    setCheatDetected(true);

    try {
      if (session?.user?.id) {
        await fetch("/api/admin/users/cheat-ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            reason: `Cheat/Tampering Detected: ${reason}`,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to report cheat event:", err);
    }
  };

  const handleAcknowledgeBan = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!cheatDetected) return null;

  return (
    <Dialog open={cheatDetected} onOpenChange={() => {}}>
      <DialogContent className="bg-zinc-950 border-destructive text-white max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-6 h-6 text-destructive animate-bounce" />
            BẠN ĐÃ VI PHẠM QUY ĐỊNH (GIAN LẬN)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-2">
            Hệ thống phát hiện bạn có hành vi gian lận hoặc can thiệp dữ liệu:
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2 my-2">
          <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Lý do vi phạm: {cheatReason}
          </p>
          <p className="text-[11px] text-white/80">
            Tài khoản của bạn đã bị báo cáo lên Admin Master và ngay lập tức bị <span className="font-bold text-destructive underline">KHÓA VĨNH VIỄN (BAND ACCOUNT)</span>.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAcknowledgeBan}
            className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
          >
            Tôi Đã Hiểu (Đăng Xuất)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
