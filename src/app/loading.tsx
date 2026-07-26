import { KeyRound } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-emerald-400">
      <KeyRound className="w-10 h-10 text-emerald-400 animate-pulse" />
    </div>
  );
}
