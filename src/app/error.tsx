"use client";

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
      <ShieldAlert className="w-12 h-12 text-red-400" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
