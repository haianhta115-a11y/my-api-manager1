"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  Ban,
  ShieldCheck,
  Crown,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Globe,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count?: {
    apiKeys: number;
  };
}

interface BlockedIpItem {
  id: string;
  ipAddress: string;
  reason: string | null;
  createdAt: string;
}

interface UsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersModal({ open, onOpenChange }: UsersModalProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Create User State
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("vip");
  const [isCreating, setIsCreating] = useState(false);

  // Block IP Custom State
  const [customIp, setCustomIp] = useState("");
  const [isBlockingIp, setIsBlockingIp] = useState(false);

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
        setBlockedIps(json.blockedIps || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsersData();
    }
  }, [open]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Vui lòng nhập đầy đủ tài khoản và mật khẩu!");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUsername,
          password: newPassword,
          name: newName || newUsername,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo tài khoản thất bại");
      toast.success("Tạo tài khoản mới thành công!");
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setCreateOpen(false);
      fetchUsersData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thất bại");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn KICK & XÓA tài khoản "${userName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa tài khoản thất bại");
      toast.success(data.message);
      fetchUsersData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const handleToggleUserBlock = async (userId: string, currentStatus: string) => {
    const action = currentStatus === "blocked" ? "unblock_user" : "block_user";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thất bại");
      toast.success(data.message);
      fetchUsersData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const handleBlockIpCustom = async (ipToBlock?: string) => {
    const ip = ipToBlock || customIp.trim();
    if (!ip) {
      toast.error("Vui lòng nhập địa chỉ IP cần khóa!");
      return;
    }
    setIsBlockingIp(true);
    try {
      const res = await fetch("/api/admin/users/any", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block_ip", ipAddress: ip }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Khóa IP thất bại");
      toast.success(data.message);
      setCustomIp("");
      fetchUsersData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setIsBlockingIp(false);
    }
  };

  const handleUnblockIp = async (ipAddress: string) => {
    try {
      const res = await fetch("/api/admin/users/any", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock_ip", ipAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mở khóa IP thất bại");
      toast.success(data.message);
      fetchUsersData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                <Users className="w-5 h-5 text-emerald-400" />
                Quản Lý Tài Khoản & Khóa IP (Admin Control Panel)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Tạo tài khoản VIP/User, kick/xóa tài khoản, và quản lý chặn địa chỉ IP truy cập trái phép.
              </DialogDescription>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Tạo Tài Khoản Mới
            </Button>
          </div>
        </DialogHeader>

        {/* User Search & Stats */}
        <div className="flex items-center justify-between gap-4 my-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm tài khoản, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-white/5 border-white/10 text-xs h-8"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUsersData}
            className="h-8 text-xs text-muted-foreground gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {/* Users Table */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-muted-foreground font-semibold border-b border-white/10">
              <tr>
                <th className="p-3">Tài Khoản / Tên</th>
                <th className="p-3">Quyền Hạn</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Số Key</th>
                <th className="p-3 text-right">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Chưa có tài khoản nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin" || u.email === "hjk@admin.com";
                  const isBlocked = u.status === "blocked";

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white">
                          {u.name || u.email?.split("@")[0]}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {u.email}
                        </div>
                      </td>

                      <td className="p-3">
                        {isAdmin ? (
                          <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-[10px] gap-1 font-bold">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Admin Master
                          </Badge>
                        ) : u.role === "vip" ? (
                          <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] gap-1 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            VIP User
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Normal User
                          </Badge>
                        )}
                      </td>

                      <td className="p-3">
                        {isBlocked ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Khóa (Blocked)
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                            Hoạt động
                          </Badge>
                        )}
                      </td>

                      <td className="p-3 font-mono text-emerald-400 font-bold">
                        {u._count?.apiKeys ?? 0} keys
                      </td>

                      <td className="p-3 text-right">
                        {isAdmin ? (
                          <span className="text-[10px] text-muted-foreground italic">Gốc Admin</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserBlock(u.id, u.status)}
                              className={`h-7 px-2 text-[11px] gap-1 ${
                                isBlocked
                                  ? "text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-amber-400 hover:bg-amber-500/10"
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {isBlocked ? "Mở Khóa" : "Khóa"}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id, u.name || u.email || "User")}
                              className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Kick / Xóa
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* IP Blocking Section */}
        <div className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold text-sky-400">Danh Sách Địa Chỉ IP Bị Khóa (Blocked IPs)</h4>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nhập địa chỉ IP cần khóa (Ví dụ: 1.2.3.4)..."
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              className="bg-white/5 border-white/10 text-xs font-mono"
            />
            <Button
              onClick={() => handleBlockIpCustom()}
              disabled={isBlockingIp || !customIp.trim()}
              className="bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs shrink-0"
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              Khóa IP Này
            </Button>
          </div>

          {blockedIps.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {blockedIps.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-xs font-mono text-destructive"
                >
                  <span>{b.ipAddress}</span>
                  <button
                    onClick={() => handleUnblockIp(b.ipAddress)}
                    className="text-white/60 hover:text-white ml-1"
                    title="Gỡ khóa IP"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Modal Sub-Dialog: Create Account */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Tạo Tài Khoản Cho Người Dùng Mới
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cấp tài khoản đăng nhập và phân quyền cho thành viên/VIP.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tên Tài Khoản / Email đăng nhập</Label>
              <Input
                placeholder="Ví dụ: vipuser01"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-white/5 border-white/10 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mật khẩu</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tên hiển thị (Tùy chọn)</Label>
              <Input
                placeholder="Ví dụ: VIP Member 1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/5 border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Phân Quyền</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-white/5 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="vip">VIP User (Thành viên VIP)</SelectItem>
                  <SelectItem value="user">Normal User (Thành viên thường)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="text-xs">
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !newUsername.trim() || !newPassword.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              >
                {isCreating ? "Đang tạo..." : "Xác Nhận Tạo Tài Khoản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
