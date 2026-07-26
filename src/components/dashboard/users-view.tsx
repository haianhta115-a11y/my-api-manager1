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
  CheckCircle2,
  User,
} from "lucide-react";
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

export function UsersView() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("vip");
  const [isCreating, setIsCreating] = useState(false);

  // Custom IP Block State
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
    fetchUsersData();
  }, []);

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
      toast.success("Tạo tài khoản người dùng mới thành công!");
      setNewUsername("");
      setNewPassword("");
      setNewName("");
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
      const res = await fetch("/api/admin/users/action", {
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
      const res = await fetch("/api/admin/users/action", {
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
    <div className="space-y-6">
      {/* 1. Header & Create User Form Card */}
      <div className="glass rounded-xl p-6 border border-white/10 bg-gradient-to-r from-emerald-950/20 via-black to-amber-950/20 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Tạo Tài Khoản Người Dùng Mới (Admin Only)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Chỉ Admin Master mới có quyền khởi tạo tài khoản đăng nhập và cấp quyền cho thành viên.
        </p>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs text-emerald-400">Tài khoản / Email đăng nhập *</Label>
            <Input
              placeholder="Nhập tên tài khoản..."
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-white/5 border-white/10 text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-emerald-400">Mật khẩu *</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-xs font-mono h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-emerald-400">Phân Quyền</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-white/5 border-white/10 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                <SelectItem value="vip">VIP User (Quyền VIP)</SelectItem>
                <SelectItem value="user">Normal User (Quyền Thường)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              disabled={isCreating || !newUsername.trim() || !newPassword.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-lg shadow-emerald-500/20"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
              Tạo Tài Khoản Ngay
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Registered Users Management List */}
      <div className="glass rounded-xl p-5 border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Danh Sách Tài Khoản Đã Khởi Tạo</h4>
            <Badge className="bg-emerald-500/20 text-emerald-400 font-mono text-xs">
              {users.length} Users
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, tài khoản..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white/5 border-white/10 text-xs h-8"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsersData}
              className="h-8 text-xs bg-white/5 border-white/10 gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
          </div>
        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-muted-foreground font-semibold border-b border-white/10">
              <tr>
                <th className="p-3">Tài Khoản</th>
                <th className="p-3">Quyền Hạn</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Số Key Đã Tạo</th>
                <th className="p-3">Ngày Tạo</th>
                <th className="p-3 text-right">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Chưa có tài khoản nào. Bạn hãy sử dụng form bên trên để tạo tài khoản mới.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin" || u.email === "hjk@admin.com";
                  const isBlocked = u.status === "blocked";

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {isAdmin ? (
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {u.name || u.email?.split("@")[0]}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {u.email}
                        </div>
                      </td>

                      <td className="p-3">
                        {isAdmin ? (
                          <Badge className="bg-amber-500/15 border-amber-500/30 text-amber-400 text-[10px] gap-1 font-bold">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Admin Master
                          </Badge>
                        ) : u.role === "vip" ? (
                          <Badge className="bg-emerald-500/15 border-emerald-500/30 text-emerald-400 text-[10px] gap-1 font-bold">
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

                      <td className="p-3 text-[11px] text-muted-foreground font-mono">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right">
                        {isAdmin ? (
                          <span className="text-[10px] text-muted-foreground italic">Admin Gốc</span>
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
                              className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 gap-1 font-bold"
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
      </div>

      {/* 3. IP Block List Management Card */}
      <div className="glass rounded-xl p-5 border border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-bold text-sky-400">Danh Sách Khóa Địa Chỉ IP (IP Whitelist & Blacklist)</h4>
        </div>

        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Nhập địa chỉ IP cần chặn (Ví dụ: 1.2.3.4)..."
            value={customIp}
            onChange={(e) => setCustomIp(e.target.value)}
            className="bg-white/5 border-white/10 text-xs font-mono h-9"
          />
          <Button
            onClick={() => handleBlockIpCustom()}
            disabled={isBlockingIp || !customIp.trim()}
            className="bg-destructive hover:bg-destructive/90 text-white font-bold text-xs h-9 shrink-0"
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
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-xs font-mono text-destructive"
              >
                <span>{b.ipAddress}</span>
                <button
                  onClick={() => handleUnblockIp(b.ipAddress)}
                  className="text-white/60 hover:text-white font-bold ml-1"
                  title="Mở khóa IP"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
