"use client"

import { useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { LogOut, AlertCircle } from "lucide-react"

export function LogoutButton() {
  const { signOut } = useClerk()

  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 transition-colors gap-2">
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-slate-900/90 backdrop-blur-xl border-slate-800 text-slate-50 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        
        <DialogHeader className="pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Confirm Log Out</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-base leading-relaxed">
            Are you sure you want to log out? Any unsaved changes might be lost. You'll need to sign back in to access your workspace.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-8 flex flex-col-reverse sm:flex-row gap-3 bg-white/5 -mx-6 -mb-6 p-6 border-t border-white/5">
          <DialogClose render={
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 flex-1">
              Stay Signed In
            </Button>
          }>
            Stay Signed In
          </DialogClose>
          <Button 
            variant="destructive" 
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-none shadow-lg shadow-red-900/20 font-semibold"
          >
            Confirm Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
