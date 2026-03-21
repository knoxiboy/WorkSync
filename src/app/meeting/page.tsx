"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MeetingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Generate a clean, human-readable-ish room ID
    const randomId = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString().slice(-6);
    const roomId = `room-${randomId}-${timestamp}`;
    
    router.replace(`/meeting/${roomId}`);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-500 w-12 h-12 mx-auto mb-4" />
        <p className="text-slate-400 font-medium tracking-tight">Creating your intelligence room...</p>
      </div>
    </div>
  );
}
