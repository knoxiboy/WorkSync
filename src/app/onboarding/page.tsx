"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl w-full">
        <Card>
          <form onSubmit={handleCreateCompany}>
            <CardHeader>
              <CardTitle>Create a Company</CardTitle>
              <CardDescription>Start a new workspace as a Manager</CardDescription>
            </CardHeader>
            <CardContent>
              <Input 
                placeholder="Company Name" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
                disabled={loading} 
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full">Create Company</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <form onSubmit={handleJoinCompany}>
            <CardHeader>
              <CardTitle>Join a Company</CardTitle>
              <CardDescription>Enter your invite code from your Manager</CardDescription>
            </CardHeader>
            <CardContent>
              <Input 
                placeholder="Invite Code" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value)} 
                disabled={loading} 
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="outline" disabled={loading} className="w-full">Join Company</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
