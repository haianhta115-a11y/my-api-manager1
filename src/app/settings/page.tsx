"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Moon,
  Sun,
  KeyRound,
  Save,
  ArrowLeft,
  Loader2,
  Shield,
  Calendar,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { setTheme } = useTheme();
  const [name, setName] = useState("");
  const [themePref, setThemePref] = useState("dark");
  const [role, setRole] = useState("user");
  const [createdAt, setCreatedAt] = useState("");
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json();
        if (data.user) {
          setName(data.user.name || "");
          setThemePref(data.user.themePref || "dark");
          setRole(data.user.role || "user");
          setCreatedAt(data.user.createdAt || "");
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (status === "authenticated") fetchSettings();
  }, [status]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, themePref, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setTheme(themePref);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-emerald-500 opacity-20" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-400" />
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account preferences and security
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <User className="w-4 h-4 text-emerald-400" />
            Profile
          </h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-white/5 border-white/10 opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Role</Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white/5 border border-white/10">
                  {role === "admin" ? (
                    <>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">Admin (Root Authority)</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">VIP User</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white/5 border border-white/10">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">
                    {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Theme */}
            <div className="space-y-2">
              <Label>Theme Preference</Label>
              <Select value={themePref} onValueChange={setThemePref}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </span>
                  </SelectItem>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </form>
        </motion.div>



        {/* Password Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-white/5 border-white/10 font-mono-key"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-white/10 font-mono-key"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 font-mono-key"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {changingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
