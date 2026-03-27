import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, ShieldCheck, LogIn, LayoutDashboard } from "lucide-react";
import { SignInButton, UserButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LogoutButton } from "@/components/LogoutButton";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">WorkSyncAI</span>
          </Link>

          <div className="flex items-center gap-4">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 transition-colors gap-2">
                  <LogIn className="w-4 h-4" />
                  Log in
                </Button>
              </SignInButton>
            ) : (
              <>
                <LogoutButton />
                <div className="pl-2 border-l border-white/10">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 border border-white/10"
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 pt-32 pb-16 text-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-violet-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-1000">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Workflow Orchestration</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Sync Meetings. <br />
            Evaluate Code. <br />
            <span className="text-indigo-500">Automate Success.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
            WorkSyncAI transforms meeting transcripts into actionable tasks and uses AI to evaluate your team's GitHub PRs automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 pt-4">
            {!isSignedIn ? (
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg" className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-indigo-600/20 gap-2 text-base transition-all hover:scale-105 active:scale-95">
                  Get started <ArrowRight className="w-4 h-4" />
                </Button>
              </SignUpButton>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-indigo-600/20 gap-2 text-base transition-all hover:scale-105 active:scale-95">
                  Go to Dashboard <LayoutDashboard className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        {/* ... (rest of the file unchanged) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-1000 delay-500">
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors group">
            <Zap className="w-10 h-10 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">Instant Task Extraction</h3>
            <p className="text-slate-400 leading-relaxed text-sm">Paste a transcript, and Llama 3 instantly identifies tasks and assigns them to the right owners.</p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors group text-left">
            <Sparkles className="w-10 h-10 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">Automated PR Review</h3>
            <p className="text-slate-400 leading-relaxed text-sm">Engineers submit PRs and our AI evaluates correctness, quality, and completeness in seconds.</p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-colors group text-left">
            <ShieldCheck className="w-10 h-10 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">Smart Escalation</h3>
            <p className="text-slate-400 leading-relaxed text-sm">Automated cron jobs track deadlines and alert managers when tasks go overdue, ensuring zero friction.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>© 2026 WorkSyncAI. Precision built for agile teams.</p>
      </footer>
    </div>
  );
}
