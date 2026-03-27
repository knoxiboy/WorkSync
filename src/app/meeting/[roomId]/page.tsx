"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2, ArrowLeft, Sparkles, Mic, Languages, Share2, MessageSquare, AlertTriangle, X, ChevronRight, UserPlus } from "lucide-react";
import { TaskAssignmentModal } from "@/components/TaskAssignmentModal";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LiveKitRoom, useLocalParticipant, useRemoteParticipants, useRoomContext, GridLayout, ParticipantTile, useTracks, ControlBar, Chat } from '@livekit/components-react';
import { DataPacket_Kind, Room, Participant, Track } from "livekit-client";
import '@livekit/components-styles';

// NEW: Decoupled sidebar component to prevent re-renders of the video room
// NEW: Decoupled sidebar component with glassmorphic styling
const TranscriptionFeed = memo(({ transcript, interimTranscript, activeTab, onTabChange, isOpen, onClose }: any) => {
  return (
    <div className={`
      fixed lg:relative inset-y-0 right-0 z-[60] lg:z-20
      w-80 max-w-[85vw] lg:w-80 
      border-l border-white/5 bg-slate-950/80 lg:bg-slate-950/40 backdrop-blur-3xl lg:backdrop-blur-2xl 
      flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      ${!isOpen && 'lg:flex hidden'}
    `}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3 lg:hidden">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4 mr-2" /> Close
          </Button>
        </div>
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => onTabChange('feed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'feed' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <Sparkles className={`w-3 h-3 ${activeTab === 'feed' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Intelligence</span>
            <span className="sm:hidden">AI</span>
          </button>
          <button 
            onClick={() => onTabChange('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {activeTab === 'feed' ? (
          <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar selection:bg-indigo-500/30">
            <div className="space-y-4">
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold">Live Aggregation Active</span>
              </div>
              
              {transcript ? (
                <div className="text-slate-300 whitespace-pre-wrap divide-y divide-white/5">
                  {transcript.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                    <div key={i} className="py-2 animate-in fade-in slide-in-from-left-2 duration-500">
                      <span className="text-indigo-400 font-bold mr-2">
                        {line.split(']:')[0] + ']:'}
                      </span>
                      <span className="text-slate-300">{line.split(']:')[1] || ''}</span>
                    </div>
                  ))}
                  {interimTranscript && (
                    <div className="py-2 text-indigo-400/60 italic animate-pulse">
                      [Me]: {interimTranscript}...
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center opacity-10">
                  <Languages className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-sans uppercase tracking-widest">Awaiting speech data...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-transparent lk-chat-container h-full">
            <Chat />
          </div>
        )}
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm lg:hidden -z-10" 
          onClick={onClose}
        />
      )}
    </div>
  );
});

TranscriptionFeed.displayName = "TranscriptionFeed";

// Internal meeting component to access LiveKit hooks
const MeetingContent = memo(({ 
  roomId, 
  onTranscriptUpdate, 
  onEndMeeting, 
  loading,
  isListening,
  toggleTranscription,
  copyLink,
  onOpenSidebar,
  onOpenAssignTask
}: any) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pinnedTrackSid, setPinnedTrackSid] = useState<string | null>(null);
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const router = useRouter();

  // Dynamic Layout Logic
  const renderParticipants = () => {
    // Robust track filtering to include placeholders for participants without video
    const allTracks = tracks.filter(t => t.participant);
    
    if (allTracks.length === 0) return null;

    if (allTracks.length === 1) {
      // Single person: Full View
      const track = allTracks[0];
      return (
        <div className="w-full h-full p-2 md:p-4 animate-in fade-in zoom-in-95 duration-500">
           <div className="relative w-full h-full rounded-3xl border border-white/5 overflow-hidden shadow-2xl bg-slate-900">
             <ParticipantTile 
               trackRef={track} 
               className="w-full h-full" 
             />
             {(!track.publication || track.publication.isMuted) && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10 pointer-events-none">
                 <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                   <span className="text-4xl md:text-5xl font-black text-indigo-400">
                     {(track.participant.name || track.participant.identity).slice(0, 2).toUpperCase()}
                   </span>
                 </div>
               </div>
             )}
             <div className="absolute bottom-6 left-6 px-3 py-1.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-widest z-20">
               {track.participant.name || track.participant.identity}
             </div>
           </div>
        </div>
      );
    }

    if (allTracks.length === 2) {
      // Dual person: PiP Mode
      const remoteTrack = allTracks.find(t => !t.participant.isLocal);
      const currentPinnedSid = pinnedTrackSid || remoteTrack?.publication?.trackSid || allTracks[0].publication?.trackSid || allTracks[0].participant.sid;
      
      const mainTrack = allTracks.find(t => (t.publication?.trackSid === currentPinnedSid) || (t.participant.sid === currentPinnedSid)) || allTracks[0];
      const secondaryTrack = allTracks.find(t => t !== mainTrack) || (allTracks[1] || allTracks[0]);

      return (
        <div className="relative w-full h-full p-2 md:p-4 animate-in fade-in duration-500">
          {/* Main View */}
          <div className="w-full h-full transition-all duration-500 ease-in-out relative rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-slate-900">
            <ParticipantTile 
              trackRef={mainTrack} 
              className="w-full h-full" 
            />
            {(!mainTrack.publication || mainTrack.publication.isMuted) && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10 pointer-events-none">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                   <span className="text-4xl md:text-5xl font-black text-indigo-400">
                     {(mainTrack.participant.name || mainTrack.participant.identity).slice(0, 2).toUpperCase()}
                   </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-6 px-3 py-1.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-widest z-20">
              {mainTrack.participant.name || mainTrack.participant.identity}
            </div>
          </div>
          
          {/* PiP View (Floating) */}
          <div 
            onClick={() => setPinnedTrackSid(secondaryTrack?.publication?.trackSid || secondaryTrack.participant.sid)}
            className="absolute bottom-10 right-10 w-32 h-20 md:w-64 md:h-40 z-30 group cursor-pointer transition-all duration-500 hover:scale-105 active:scale-95"
          >
            <div className="w-full h-full rounded-2xl border border-white/20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-800 ring-2 ring-indigo-500/30 group-hover:ring-indigo-500/60 transition-all relative">
               <ParticipantTile 
                 trackRef={secondaryTrack} 
                 className="w-full h-full object-cover" 
               />
               {(!secondaryTrack.publication || secondaryTrack.publication.isMuted) && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 pointer-events-none">
                   <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-indigo-500/20 flex items-center justify-center backdrop-blur-xl">
                     <span className="text-xs md:text-xl font-black text-indigo-400">
                       {(secondaryTrack.participant.name || secondaryTrack.participant.identity).slice(0, 2).toUpperCase()}
                     </span>
                   </div>
                 </div>
               )}
               <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                  <span className="bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] border border-white/10 text-white shadow-xl">Swap View</span>
               </div>
               <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-950/60 backdrop-blur-md border border-white/10 text-[8px] md:text-[9px] font-bold text-white uppercase tracking-wider z-20">
                 {secondaryTrack.participant.name || secondaryTrack.participant.identity}
               </div>
            </div>
          </div>
        </div>
      );
    }

    // Grid mode for 3+ people
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto custom-scrollbar p-2 md:p-4 animate-in fade-in duration-500">
        {allTracks.map((track) => (
          <div key={`${track.participant.identity}-${track.source}-${track.publication?.trackSid || 'placeholder'}`} className="relative group">
            <ParticipantTile 
              trackRef={track}
              className="rounded-2xl border border-white/5 overflow-hidden shadow-2xl transition-all duration-500 hover:border-indigo-500/30 aspect-video md:aspect-auto bg-slate-900 h-full w-full" 
            />
            {(!track.publication || track.publication.isMuted) && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 pointer-events-none">
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-2xl animate-in zoom-in-50 duration-700">
                  <span className="text-2xl md:text-3xl font-black text-indigo-400">
                    {(track.participant.name || track.participant.identity).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-slate-950/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest z-20">
              {track.participant.name || track.participant.identity}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!room || !localParticipant) return;

    (window as any).lk_room = room;

    const handleData = (payload: Uint8Array, participant: any) => {
      const decoder = new TextDecoder();
      const text = decoder.decode(payload);
      try {
        const data = JSON.parse(text);
        if (data.type === "transcript-segment") {
          console.log("Incoming remote transcript:", data.text);
          onTranscriptUpdate(`[${participant?.name || participant?.identity || 'Peer'}]: ${data.text}\n`);
        }
      } catch (e) {
        console.error("Failed to parse incoming data", e);
      }
    };

    localParticipant.on("dataReceived", handleData);
    return () => {
      localParticipant.off("dataReceived", handleData);
      delete (window as any).lk_room;
    };
  }, [localParticipant, onTranscriptUpdate]);

  return (
    <main className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      <header className="px-4 md:px-6 h-16 flex justify-between items-center border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-3 md:gap-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-white hover:bg-white/5 transition-colors group px-2 md:px-3" 
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 md:mr-2 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-xs font-medium uppercase tracking-widest hidden md:inline">Hub</span>
          </Button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-[10px] md:text-sm tracking-tight truncate max-w-[80px] md:max-w-none">
                {roomId.slice(0, 8)}
              </h2>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>
            <span className="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-widest font-bold hidden sm:block">Encrypted</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 md:px-3 border-white/5 bg-white/5 text-slate-400 text-[9px] md:text-[10px] uppercase font-bold tracking-widest gap-2 hover:bg-white/10 hover:text-white transition-all rounded-lg" 
            onClick={copyLink}
          >
            <Share2 className="w-3 h-3" /> <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <Button 
            variant="outline"
            className="rounded-xl border-white/5 bg-white/5 h-8 md:h-9 px-2 md:px-4 gap-2 text-indigo-400 hover:bg-indigo-500/10 hover:text-white transition-all duration-300 border-indigo-500/30"
            onClick={onOpenAssignTask}
          >
            <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:inline">Assign</span>
          </Button>

          <Button 
            variant="outline"
            className={`rounded-xl border-white/5 h-8 md:h-9 px-2 md:px-4 gap-2 transition-all duration-300 ${isListening ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => {
              toggleTranscription();
              if (!isListening) onOpenSidebar('feed');
            }}
          >
            <Languages className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isListening ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:inline">{isListening ? 'Live' : 'Analyze'}</span>
          </Button>

          <Button 
            variant="outline"
            className="rounded-xl border-white/5 bg-white/5 h-8 md:h-9 px-2 md:px-4 gap-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300"
            onClick={() => onOpenSidebar('chat')}
          >
            <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:inline">Chat</span>
          </Button>

          <Button 
            onClick={onEndMeeting}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-8 md:h-9 px-3 md:px-6 gap-2 font-bold shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {loading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            <span className="text-[10px] md:text-xs uppercase tracking-widest hidden xs:inline">Extract</span>
            <span className="text-[10px] md:text-xs uppercase tracking-widest hidden md:inline">Tasks</span>
          </Button>

          <Button 
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 md:h-9 px-2 md:px-4 text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] md:text-xs font-bold"
            onClick={() => setShowExitConfirm(true)}
          >
            Leave
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#020617] relative">
        <div className="flex-1 overflow-hidden">
          {renderParticipants()}
        </div>
        
        {/* Floating Control Bar */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 px-3 md:px-6 py-2 md:py-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2 group transition-all hover:bg-slate-900/80 hover:scale-[1.02]">
          <ControlBar variation="minimal" controls={{ leave: false }} />
        </div>
      </div>

      {/* CUSTOM ALERT UI: Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative p-6 md:p-8 text-center">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="bg-red-500/10 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
              </div>
              
              <h3 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 mb-2">
                Leave Session?
              </h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-8 px-4">
                You’re about to exit the workspace. Your live transcription and unextracted tasks will be <span className="text-red-400 font-bold italic">permanently lost</span>.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full rounded-2xl h-10 md:h-12 border-white/5 bg-white/5 text-white font-bold hover:bg-white/10 transition-all active:scale-95 text-xs md:text-sm"
                >
                  Stay in Session
                </Button>
                <Button 
                  onClick={() => {
                    room.disconnect();
                    router.push("/dashboard");
                  }}
                  className="w-full rounded-2xl h-10 md:h-12 bg-red-500/10 text-red-400 border border-red-500/20 font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group text-xs md:text-sm"
                >
                  Leave Session <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM UI: Processing Intelligence Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="text-center space-y-6 md:space-y-8 max-w-sm animate-in zoom-in-95 duration-500">
             <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
               <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
               <Sparkles className="absolute inset-0 m-auto w-8 h-8 md:w-10 md:h-10 text-indigo-400 animate-pulse" />
             </div>
             
             <div className="space-y-2 md:space-y-3">
               <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">Aggregating Wisdom</h3>
               <p className="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-[0.2em] animate-pulse">
                 AI is distilling meeting intelligence...
               </p>
             </div>
             
             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-[shimmer_2s_infinite]" style={{ width: '60%' }} />
             </div>
          </div>
        </div>
      )}
    </main>
  );
});

MeetingContent.displayName = "MeetingContent";

export default function SharedMeetingPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const roomId = params.roomId as string;
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState('feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const router = useRouter();
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const appendToTranscript = useCallback((text: string) => {
    setTranscript((prev: string) => prev + text);
  }, []);

  const broadcastTranscript = useCallback((text: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).lk_room) {
          const room = (window as any).lk_room;
          const encoder = new TextEncoder();
          const data = encoder.encode(JSON.stringify({ type: "transcript-segment", text }));
          room.localParticipant.publishData(data, { kind: DataPacket_Kind.RELIABLE });
      }
    } catch (e) {
      console.error("Broadcast failed", e);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user && roomId) {
      (async () => {
        try {
          const resp = await fetch("/api/livekit/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: roomId, username: user.fullName || "User" }),
          });
          const data = await resp.json();
          if (data.token) {
            setToken(data.token);
          } else {
            console.error("Token error:", data);
            toast.error("Failed to generate meeting token");
          }
        } catch (e) {
          console.error(e);
          toast.error("Error connecting to meeting provider");
        }
      })();
    }
  }, [isLoaded, user, roomId]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            console.log("Final Transcript Segment:", transcriptSegment);
            broadcastTranscript(transcriptSegment);
            appendToTranscript(`[Me]: ${transcriptSegment}\n`);
            setInterimTranscript("");
          } else {
            interim += transcriptSegment;
          }
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        
        console.error("Speech Recognition Error:", event.error);
        
        // Handle network or aborted errors by attempting a restart
        if ((event.error === 'network' || event.error === 'aborted') && isListeningRef.current) {
          console.warn("Recoverable transcription error, attempting restart...");
          setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch (e) {}
            }
          }, 1000);
          return;
        }

        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied for transcription.");
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current.onend = () => {
        // Use a small delay before restarting to ensure the previous session has fully released resources
        if (isListeningRef.current && recognitionRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Failed to restart recognition:", e);
              }
            }
          }, 500);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [broadcastTranscript, appendToTranscript]);

  const toggleTranscription = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript("");
      toast.info("Live transcription paused.");
    } else {
      try {
        setInterimTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
        toast.success("Live transcription active! Speak clearly.");
      } catch (e) {
        console.error("Start Error:", e);
      }
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard!");
  };

  const handleEndMeeting = async () => {
    if (!transcript.trim()) {
      toast.error("No transcript captured to extract tasks from.");
      return;
    }

    setLoading(true);
    toast.info("Processing meeting intelligence...");
    
    try {
      await fetch("/api/meeting/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, roomId }),
      });

      if (recognitionRef.current) recognitionRef.current.stop();
      toast.success("Meeting intelligence processed!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to extract tasks");
    } finally {
      setLoading(false);
    }
  };

  const openSidebar = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(true);
  };

  if (!isLoaded || (token === "" && user)) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div>;

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <LiveKitRoom
          key={token}
          video={false}
          audio={false}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          data-lk-theme="default"
          style={{ height: '100%', width: '100%', display: 'flex' }}
        >
          <div className="flex-1 flex flex-col min-w-0">
             <MeetingContent 
               roomId={roomId}
               loading={loading}
               isListening={isListening}
               toggleTranscription={toggleTranscription}
               onEndMeeting={handleEndMeeting}
               copyLink={copyLink}
               onTranscriptUpdate={appendToTranscript}
               onOpenSidebar={openSidebar}
               onOpenAssignTask={() => setIsAssignModalOpen(true)}
              />
              <TaskAssignmentModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                meetingId={roomId}
              />
          </div>
          <TranscriptionFeed 
            transcript={transcript}
            interimTranscript={interimTranscript}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </LiveKitRoom>
      </div>
    </div>
  );
}


