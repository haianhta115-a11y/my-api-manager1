import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
      <KeyRound className="w-12 h-12 text-emerald-400" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
