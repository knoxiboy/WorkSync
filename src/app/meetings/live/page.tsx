import { LiveMeetingRoom } from "@/components/meetings/LiveMeetingRoom";

export default function MeetingPage() {
  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-white to-white/40 bg-clip-text text-transparent">
          Neural Meeting Nexus
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active Session: WS-942-NEURAL • 3 Participants • AI Monitoring Enabled
        </p>
      </div>
      <LiveMeetingRoom />
    </div>
  );
}
