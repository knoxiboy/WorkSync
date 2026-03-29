"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Building2, Plus, LogIn, ChevronRight } from "lucide-react";

export default function OnboardingPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [fetchingUser, setFetchingUser] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setDbUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch user context", err);
      } finally {
        setFetchingUser(false);
      }
    }
    if (clerkLoaded && clerkUser) {
      checkUser();
    }
  }, [clerkLoaded, clerkUser]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return toast.error("Please enter a company name");
    
    setLoading(true);
    try {
      const res = await fetch("/api/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Company created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return toast.error("Please enter an invite code");
    
    setLoading(true);
    try {
      const res = await fetch("/api/company/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Joined company!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser || !clerkLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 md:p-8 space-y-8">
      {/* Branding */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">WorkSync</h1>
        <p className="text-slate-500 font-medium tracking-widest text-xs uppercase">Developer Execution Platform</p>
      </div>

      <div className="max-w-4xl w-full space-y-8">
        {/* Fast Path: All Joined Workspaces */}
        {dbUser && dbUser.length > 0 && (
          <Card className="border-none shadow-xl shadow-indigo-500/10 bg-white overflow-hidden group border-2 border-indigo-500/20">
             <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
             <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-500" /> Your Workspaces
                  </CardTitle>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">{dbUser.length} {dbUser.length === 1 ? 'Space' : 'Spaces'} Found</span>
                </div>
                <CardDescription>Select a workspace to enter or join a new one below.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-3">
                {dbUser.map((profile: any) => (
                  <button 
                    key={profile.id}
                    onClick={() => router.push(`/dashboard?u=${profile.id}`)}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group/ws"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                          {profile.company.name.slice(0, 1).toUpperCase()}
                       </div>
                       <div className="text-left">
                          <div className="text-sm font-black text-slate-900 group-hover/ws:text-indigo-600 transition-colors uppercase italic">{profile.company.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Role: {profile.role}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs">
                       Enter Space
                       <ChevronRight className="w-4 h-4 group-hover/ws:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
             </CardContent>
          </Card>
        )}

        {/* Traditional Path: Join or Create */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <form onSubmit={handleCreateCompany}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Plus className="w-5 h-5 text-indigo-500" /> Create Company
                </CardTitle>
                <CardDescription>Start a new workspace as a Manager</CardDescription>
              </CardHeader>
              <CardContent>
                <Input 
                  placeholder="e.g. Acme Software" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  disabled={loading} 
                  className="rounded-xl border-slate-200 focus:ring-indigo-500"
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl h-12 font-bold shadow-lg shadow-slate-900/10">Initialize Workspace</Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <form onSubmit={handleJoinCompany}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <LogIn className="w-5 h-5 text-slate-400" /> Join Company
                </CardTitle>
                <CardDescription>Enter your invite code from your Manager</CardDescription>
              </CardHeader>
              <CardContent>
                <Input 
                  placeholder="INVITE-XXXX" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value)} 
                  disabled={loading} 
                  className="rounded-xl border-slate-200 focus:ring-indigo-500"
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="outline" disabled={loading} className="w-full rounded-xl h-12 font-bold border-slate-200 hover:bg-slate-50">Connect to Workspace</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
