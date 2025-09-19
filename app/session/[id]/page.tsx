'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// PeerJS is used inside the engine
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TuiFallbackDialog } from '@/components/TuiFallbackDialog';
import { PeerJsEngine } from '@/lib/call/PeerJsEngine';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NotesPanel } from '@/components/NotesPanel';
import { MicActivity } from '@/components/MicActivity';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Terminal,
  UserCircle2,
  Stethoscope,
  Send,
} from 'lucide-react';

type Role = 'patient' | 'doctor';

function getRole(): Role {
  // Naive: if coming from doctor queue use 'doctor', else 'patient'
  // Can be replaced by stronger role detection later
  const ref = document.referrer || '';
  if (ref.includes('/doctor')) return 'doctor';
  return 'patient';
}

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = useMemo(
    () => (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '',
    [params],
  );

  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [messages] = useState<Array<{ from: 'me' | 'peer'; text: string }>>([]);
  const [showTui, setShowTui] = useState(false);

  const serverMessages = useQuery(
    api.index.listMessages,
    sessionId ? { sessionId } : 'skip',
  );
  const sendServerMessage = useMutation(api.index.sendMessage);
  const setStatus = useMutation(api.index.setSessionStatus);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<PeerJsEngine | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const role: Role = getRole();
    const myId = `${role}-${sessionId}`;
    const otherId = `${role === 'patient' ? 'doctor' : 'patient'}-${sessionId}`;

    const engine = new PeerJsEngine(myId, otherId, {
      onConnected: () => setConnecting(false),
      onRemoteStream: (remote) => {
        const v = remoteVideoRef.current;
        if (v) {
          v.srcObject = remote;
          v.play().catch(() => {});
        }
      },
      onData: () => {},
      onError: (msg) => setError(msg),
    });
    engineRef.current = engine;

    engine
      .start(true)
      .then(async (local) => {
        const v = localVideoRef.current;
        if (v) {
          v.srcObject = local;
          v.muted = true;
          v.play().catch(() => {});
        }
        // Best-effort: some engines may expose an internal pc for stats.
        // @ts-ignore accessing internal for stats only
        pcRef.current = engine.pc ?? null;
        // Mark session as in_call
        if (sessionId) {
          try {
            await setStatus({ sessionId, status: 'in_call' });
          } catch {}
        }
      })
      .catch((e) => setError(e?.message ?? 'Failed to start'));

    return () => {
      engineRef.current?.close();
      pcRef.current = null;
    };
  }, [sessionId]);

  function toggleMute() {
    // Route through engine to ensure underlying stream state updates consistently
    engineRef.current?.setMuted(!muted);
    setMuted((m) => !m);
  }

  async function toggleVideo() {
    const stream = (localVideoRef.current?.srcObject as MediaStream) || null;
    if (!stream) return;
    if (videoOn) {
      for (const t of stream.getVideoTracks()) t.stop();
      setVideoOn(false);
      return;
    }
    try {
      await engineRef.current?.toggleVideo(true);
      setVideoOn(true);
    } catch {}
  }

  function sendMessage(textarea: HTMLTextAreaElement | null) {
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) return;
    // Persist to Convex; UI reads from serverMessages
    if (sessionId) {
      void sendServerMessage({ sessionId, sender: getRole(), text });
    }
    textarea.value = '';
  }

  return (
    <TooltipProvider>
      <main className="h-screen flex flex-col overflow-hidden p-4 gap-4">
        {/* Status Header */}
        <Card className="shrink-0 p-0">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                {getRole() === 'doctor' ? (
                  <>
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Doctor
                  </>
                ) : (
                  <>
                    <UserCircle2 className="w-4 h-4 mr-2" />
                    Patient
                  </>
                )}
              </Badge>
              {connecting && (
                <Badge variant="secondary">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse mr-2" />
                  Connecting...
                </Badge>
              )}
              {!connecting && !error && (
                <Badge variant="default">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full mr-2" />
                  Connected
                </Badge>
              )}
              {error && <Badge variant="destructive">Connection Error</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <MicActivity
                stream={
                  (localVideoRef.current?.srcObject as MediaStream) || null
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Video Section */}
          <div className="lg:col-span-3">
            {/* Main Remote Video Card */}
            <Card className="flex flex-col">
              <CardHeader className="px-6 py-2">
                <CardTitle className="text-base">
                  {getRole() === 'doctor' ? 'Patient' : 'Doctor'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 px-5 pt-2 pb-4">
                <div className="relative h-full min-h-[50vh] max-h-[70vh]">
                  <video
                    ref={remoteVideoRef}
                    className="w-full h-full object-cover rounded-lg bg-muted"
                    playsInline
                  />

                  {/* Local Video Preview - Small overlay in bottom right */}
                  <div className="absolute bottom-4 right-4 z-20 w-32 h-24 lg:w-48 lg:h-36">
                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                      <video
                        ref={localVideoRef}
                        className="w-full h-full object-cover bg-muted"
                        playsInline
                        muted
                      />

                      {!videoOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <div className="text-center text-muted-foreground">
                            <VideoOff className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs">You</p>
                          </div>
                        </div>
                      )}

                      {videoOn && (
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                          You
                        </div>
                      )}
                    </div>
                  </div>

                  {connecting && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <div className="w-16 h-16 border-4 border-muted-foreground border-t-primary rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-lg">Connecting...</p>
                      </div>
                    </div>
                  )}

                  {!connecting && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <UserCircle2 className="w-20 h-20 mx-auto mb-4" />
                        <p className="text-lg">
                          Waiting for{' '}
                          {getRole() === 'doctor' ? 'patient' : 'doctor'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive mt-4">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controls Card - Aligned with camera view column */}
            <Card className="shrink-0 mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={toggleMute}
                        variant={muted ? 'destructive' : 'default'}
                        size="lg"
                        className="h-14 px-8"
                      >
                        {muted ? (
                          <MicOff className="w-6 h-6 mr-2" />
                        ) : (
                          <Mic className="w-6 h-6 mr-2" />
                        )}
                        {muted ? 'Unmute' : 'Mute'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {muted ? 'Unmute microphone' : 'Mute microphone'}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={toggleVideo}
                        variant={videoOn ? 'default' : 'secondary'}
                        size="lg"
                        className="h-14 px-8"
                      >
                        {videoOn ? (
                          <Video className="w-6 h-6 mr-2" />
                        ) : (
                          <VideoOff className="w-6 h-6 mr-2" />
                        )}
                        {videoOn ? 'Camera On' : 'Camera Off'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {videoOn ? 'Turn off camera' : 'Turn on camera'}
                    </TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setShowTui(true)}
                        className="h-14 px-6"
                      >
                        <Terminal className="w-6 h-6 mr-2" />
                        TUI Fallback
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Switch to text-based interface
                    </TooltipContent>
                  </Tooltip>

                  <Button
                    onClick={() => router.refresh()}
                    variant="outline"
                    className="h-14 px-6"
                  >
                    Reconnect
                  </Button>

                  <Separator orientation="vertical" className="h-10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={async () => {
                          if (sessionId) {
                            try {
                              await setStatus({ sessionId, status: 'ended' });
                            } catch {}
                          }
                          router.push(`/session/${sessionId}/summary`);
                        }}
                        variant="destructive"
                        size="lg"
                        className="h-14 px-8"
                      >
                        <PhoneOff className="w-6 h-6 mr-2" />
                        End Call
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>End the consultation</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Chat Card */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <ScrollArea className="flex-1 min-h-[200px]">
                  <div className="space-y-2 pr-3">
                    {(serverMessages ?? []).map((m) => (
                      <div
                        key={m._id}
                        className={`flex ${m.sender === getRole() ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            m.sender === getRole()
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className="text-xs opacity-70 mb-1">
                            {m.sender === 'doctor' ? 'Doctor' : 'Patient'}
                          </div>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            m.from === 'me'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 shrink-0">
                  <Textarea
                    placeholder="Type a message..."
                    className="min-h-[40px] resize-none flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e.currentTarget);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => {
                      const textarea = document.querySelector(
                        'textarea',
                      ) as HTMLTextAreaElement;
                      sendMessage(textarea);
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="shrink-0">
              <NotesPanel
                sessionId={sessionId}
                readOnly={getRole() !== 'doctor'}
              />
            </Card>
          </div>
        </div>

        <TuiFallbackDialog
          open={showTui}
          onOpenChange={setShowTui}
          sessionId={sessionId}
        />
      </main>
    </TooltipProvider>
  );
}
