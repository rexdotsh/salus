'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// PeerJS is used inside the engine
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { TuiFallbackDialog } from '@/components/TuiFallbackDialog';
import { PeerJsEngine } from '@/lib/call/PeerJsEngine';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NotesPanel } from '@/components/NotesPanel';

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
    const stream = (localVideoRef.current?.srcObject as MediaStream) || null;
    if (!stream) return;
    for (const t of stream.getAudioTracks()) t.enabled = muted;
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
    <main className="mx-auto max-w-6xl px-4 py-6">
      <ConnectionBanner
        sessionId={sessionId}
        getStats={async () =>
          pcRef.current ? await pcRef.current.getStats() : null
        }
        onForceAudioOnly={() => {
          const stream =
            (localVideoRef.current?.srcObject as MediaStream) || null;
          if (!stream) return;
          for (const t of stream.getVideoTracks()) t.stop();
          setVideoOn(false);
        }}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Consultation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <video
                ref={localVideoRef}
                className="aspect-video w-full rounded-md bg-muted"
                playsInline
              />
              <video
                ref={remoteVideoRef}
                className="aspect-video w-full rounded-md bg-muted"
                playsInline
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={toggleMute}
                variant={muted ? 'secondary' : 'default'}
              >
                {muted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                onClick={toggleVideo}
                variant={videoOn ? 'secondary' : 'default'}
              >
                {videoOn ? 'Stop Video' : 'Start Video'}
              </Button>
              <Button variant="secondary" onClick={() => setShowTui(true)}>
                TUI Fallback
              </Button>
              <Button
                onClick={async () => {
                  if (sessionId) {
                    try {
                      await setStatus({ sessionId, status: 'ended' });
                    } catch {}
                  }
                  router.push(`/session/${sessionId}/summary`);
                }}
                variant="secondary"
              >
                End
              </Button>
              <Button onClick={() => router.refresh()} variant="secondary">
                Reconnect
              </Button>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            {connecting && (
              <div className="text-sm text-muted-foreground">Connecting…</div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-64 overflow-y-auto rounded-md border p-2 space-y-1">
                {(serverMessages ?? []).map((m) => (
                  <div
                    key={m._id}
                    className={m.sender === 'patient' ? 'text-right' : ''}
                  >
                    <div className="inline-block rounded bg-secondary px-2 py-1 text-sm">
                      {m.text}
                    </div>
                  </div>
                ))}
                {messages.map((m, i) => (
                  <div key={i} className={m.from === 'me' ? 'text-right' : ''}>
                    <div className="inline-block rounded bg-secondary px-2 py-1 text-sm">
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <Textarea
                placeholder="Type a message"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e.currentTarget);
                  }
                }}
              />
            </CardContent>
          </Card>
          <NotesPanel sessionId={sessionId} />
        </div>
      </div>
      <TuiFallbackDialog
        open={showTui}
        onOpenChange={setShowTui}
        sessionId={sessionId}
      />
    </main>
  );
}
