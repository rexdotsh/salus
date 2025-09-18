import Peer from 'peerjs';
import type { CallEngine, EngineEvents } from './CallEngine';

export class PeerJsEngine implements CallEngine {
  private peer: Peer | null = null;
  private call: ReturnType<Peer['call']> | null = null;
  private conn: ReturnType<Peer['connect']> | null = null;
  private pc: RTCPeerConnection | null = null;
  private local: MediaStream | null = null;

  constructor(
    private myId: string,
    private otherId: string,
    private events: EngineEvents = {},
  ) {}

  async start(audioOnly = true): Promise<MediaStream> {
    this.peer = new Peer(this.myId, {
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    });

    const constraints: MediaStreamConstraints = {
      audio: {
        channelCount: 1,
        noiseSuppression: true,
        echoCancellation: true,
      },
      video: audioOnly
        ? false
        : {
            width: { ideal: 426, max: 640 },
            height: { ideal: 240, max: 360 },
            frameRate: { ideal: 12, max: 15 },
          },
    };

    this.local = await navigator.mediaDevices.getUserMedia(constraints);

    await new Promise<void>((resolve, reject) => {
      if (!this.peer) return reject(new Error('Peer not created'));
      this.peer.on('open', () => resolve());
      this.peer.on('error', (e) => {
        this.events.onError?.(e.message);
        reject(e);
      });
    });

    // Data
    this.conn = this.peer.connect(this.otherId);
    this.conn.on('open', () => this.events.onConnected?.());
    this.conn.on('data', (d) => this.events.onData?.(String(d)));

    // Media
    this.call = this.peer.call(this.otherId, this.local);
    this.call.on('stream', (remote) => this.events.onRemoteStream?.(remote));
    this.call.on('error', (e) => this.events.onError?.(e.message));
    this.pc = (this.call as any)?.peerConnection ?? null;

    // Accept incoming
    this.peer.on('call', (incoming) => {
      if (!this.local) return;
      incoming.answer(this.local);
      incoming.on('stream', (remote) => this.events.onRemoteStream?.(remote));
      this.pc = (incoming as any)?.peerConnection ?? this.pc;
    });

    return this.local;
  }

  async toggleVideo(enable?: boolean): Promise<void> {
    if (!this.local) return;
    const hasVideo = this.local.getVideoTracks().length > 0;
    if (enable === false || (enable == null && hasVideo)) {
      for (const t of this.local.getVideoTracks()) t.stop();
      return;
    }
    const cam = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 426, max: 640 },
        height: { ideal: 240, max: 360 },
        frameRate: { ideal: 12, max: 15 },
      },
      audio: false,
    });
    const sender = this.call?.peerConnection
      .getSenders()
      .find((s) => s.track?.kind === 'video');
    if (sender && cam.getVideoTracks()[0]) {
      await sender.replaceTrack(cam.getVideoTracks()[0]);
    }
    this.local.addTrack(cam.getVideoTracks()[0]);
  }

  setMuted(muted: boolean): void {
    if (!this.local) return;
    for (const t of this.local.getAudioTracks()) t.enabled = !muted;
  }

  send(text: string): void {
    this.conn?.send(text);
  }

  async getStats(): Promise<RTCStatsReport | null> {
    return this.pc ? await this.pc.getStats() : null;
  }

  close(): void {
    try {
      this.peer?.destroy();
    } catch {}
    try {
      this.call?.close();
    } catch {}
    try {
      this.conn?.close();
    } catch {}
    this.pc = null;
    this.local = null;
  }
}
