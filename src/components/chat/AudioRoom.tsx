import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls,
  useCallStateHooks,
  CallingState,
  Call,
} from "@stream-io/video-react-sdk";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Users, 
  Volume2,
  Loader2,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import "@stream-io/video-react-sdk/dist/css/styles.css";

interface AudioRoomProps {
  classroomId: string;
  classroomName: string;
  onLeave: () => void;
}

interface StreamCredentials {
  token: string;
  userId: string;
  userName: string;
  apiKey: string;
}

// Inner component that uses the call hooks
const AudioRoomInner = ({ call, onLeave }: { call: Call; onLeave: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const [isMuted, setIsMuted] = useState(false);

  // Animate on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, []);

  // Pulse animation for active speakers
  useEffect(() => {
    if (containerRef.current) {
      const avatars = containerRef.current.querySelectorAll(".participant-avatar");
      gsap.to(avatars, {
        boxShadow: "0 0 20px hsla(152, 76%, 42%, 0.5)",
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
  }, [participantCount]);

  const toggleMute = useCallback(async () => {
    try {
      if (isMuted) {
        await call.microphone.enable();
      } else {
        await call.microphone.disable();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  }, [call, isMuted]);

  if (callingState === CallingState.JOINING) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Joining audio room...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between bg-accent/50 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30">
            <Volume2 className="w-3 h-3 mr-1" />
            Live Audio
          </Badge>
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isMuted ? "destructive" : "secondary"}
            onClick={toggleMute}
            className="rounded-full"
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onLeave}
            className="rounded-full"
          >
            <PhoneOff className="w-4 h-4 mr-1" />
            Leave
          </Button>
        </div>
      </div>

      {/* Audio Layout */}
      <div className="bg-background rounded-xl overflow-hidden min-h-[200px]">
        <SpeakerLayout />
      </div>

      {/* Custom Controls */}
      <div className="flex justify-center">
        <CallControls />
      </div>
    </div>
  );
};

const AudioRoom = ({ classroomId, classroomName, onLeave }: AudioRoomProps) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeCall = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const callId = `audio:${classroomId}`;
      const { data, error: fnError } = await supabase.functions.invoke<StreamCredentials>(
        "getstream-token",
        { body: { callIds: [callId] } }
      );

      if (fnError || !data) {
        throw new Error(fnError?.message || "Failed to get credentials");
      }

      const { token, userId, userName, apiKey } = data;

      // Initialize Video client
      const videoClient = new StreamVideoClient({
        apiKey,
        user: { id: userId, name: userName },
        token,
      });

      // Create or join the audio call
      const audioCall = videoClient.call("audio_room", classroomId);
      
      await audioCall.join({ create: true });

      // Disable camera, enable mic
      await audioCall.camera.disable();
      await audioCall.microphone.enable();

      setClient(videoClient);
      setCall(audioCall);
      
      toast.success("Joined audio room! 🎧");
    } catch (err) {
      console.error("Failed to join audio room:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      toast.error("Failed to join audio room");
    } finally {
      setIsConnecting(false);
    }
  }, [classroomId]);

  const handleLeave = useCallback(async () => {
    if (call) {
      await call.leave();
    }
    if (client) {
      await client.disconnectUser();
    }
    setCall(null);
    setClient(null);
    onLeave();
  }, [call, client, onLeave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [call, client]);

  if (!call || !client) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            Audio Room: {classroomName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error ? (
            <div className="text-center py-8">
              <PhoneOff className="w-12 h-12 mx-auto text-destructive/50 mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onLeave}>
                  Go Back
                </Button>
                <Button onClick={initializeCall} className="gradient-hero">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Headphones className="w-16 h-16 mx-auto text-primary/30 mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">
                Ready to join the audio room?
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                You'll be able to speak and listen with other participants in real-time.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onLeave}>
                  Cancel
                </Button>
                <Button
                  onClick={initializeCall}
                  disabled={isConnecting}
                  className="gradient-hero"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Join Audio Room
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Volume2 className="w-5 h-5 text-green-600" />
          </div>
          {classroomName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <AudioRoomInner call={call} onLeave={handleLeave} />
          </StreamCall>
        </StreamVideo>
      </CardContent>
    </Card>
  );
};

export default AudioRoom;
