"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, LogIn, Sparkles, Volume2, VolumeX, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("bungu");
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);

  const STATIONS = [
    { name: "Sơn Thủy Trùng Dương", url: "96z6HwGncc4" },
  ];
  const currentStation = STATIONS[stationIdx];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password.",
        });
      } else {
        toast.success("Welcome back, VIP!");
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground">
      {/* Background VIP effects */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/anime-login.png" 
          alt="Anime Cyberpunk Background" 
          fill 
          priority
          className="object-cover opacity-60 filter blur-sm dark:opacity-60 light:opacity-20 hidden sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-emerald-900/30" />

        {/* Floating animated neon orbs (hidden on mobile to prevent GPU lag) */}
        <motion.div
          animate={{ x: [0, 60, -40, 0], y: [0, -50, 30, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:block absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -50, 60, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:block absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px]"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[150px]"
        />
      </div>

      {/* Music Player (YouTube iframe hidden visually but audio plays) */}
      <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2 group">
        <iframe
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${currentStation.url}?autoplay=1&loop=1&playlist=${currentStation.url}&mute=${isMuted ? 1 : 0}`}
          title="Lofi Anime Music"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="hidden"
        />
        <div className="flex bg-black/60 border border-white/10 rounded-full p-1 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="hover:bg-white/10 text-emerald-400 rounded-full w-9 h-9"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <div className="w-0 overflow-hidden group-hover:w-32 transition-all duration-300 ease-in-out flex items-center">
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest pl-2 truncate w-full">
              {isMuted ? "Muted" : currentStation.name}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStationIdx((prev) => (prev + 1) % STATIONS.length)}
            className="hover:bg-white/10 text-emerald-400 rounded-full w-9 h-9"
            title="Next Station"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="w-full max-w-[1000px] h-[600px] z-10 flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-white/10 backdrop-blur-xl">
        
        {/* Left Side: Illustration */}
        <div className="hidden md:block md:w-1/2 relative bg-black">
          <Image 
            src="/anime-login.png"
            alt="Anime Hacker"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
              Master the<br/>
              <span className="text-emerald-400">Cyber Grid</span>
            </h2>
            <p className="text-sm text-white/60">
              Your VIP access to the ultimate API Key Management system. Secure, fast, and remarkably cool.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-black/60 relative"
        >
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-purple-500" />
          
          <div className="flex flex-col items-center mb-8 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative"
            >
              <KeyRound className="w-9 h-9 text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-white to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
              VIP Access
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20 text-emerald-400">
                Enterprise Grade Security
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Sign in to manage your API ecosystem.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                Tài khoản / Admin
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 text-white placeholder-white/30"
                placeholder="admin"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Mật khẩu
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 text-white placeholder-white/30"
                placeholder="bungu"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] border-0 transition-all hover:scale-[1.02]"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </motion.div>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng Nhập
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest font-mono">
              Tài khoản: admin | Mật khẩu: bungu
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
