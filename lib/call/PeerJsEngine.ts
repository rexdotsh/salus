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

  async start(audioOnly = false): Promise<MediaStream> {
    this.ensureSecureContextOrThrow();
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

    try {
      this.local = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e: any) {
      this.events.onError?.(this.formatGetUserMediaError(e));
      throw e;
    }

    await new Promise<void>((resolve, reject) => {
      if (!this.peer) return reject(new Error('Peer not created'));
      this.peer.on('open', () => resolve());
      this.peer.on('error', (e) => {
        this.events.onError?.(e.message);
        reject(e);
      });
    });

    // Data (outgoing)
    this.conn = this.peer.connect(this.otherId);
    this.conn.on('open', () => this.events.onConnected?.());
    this.conn.on('data', (d) => this.events.onData?.(String(d)));

    // Data (incoming)
    this.peer.on('connection', (incoming) => {
      this.conn = incoming;
      incoming.on('open', () => this.events.onConnected?.());
      incoming.on('data', (d) => this.events.onData?.(String(d)));
    });

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
      this.call = incoming;
    });

    return this.local;
  }

  async toggleVideo(enable?: boolean): Promise<void> {
    if (!this.local) return;
    const hasVideo = this.local.getVideoTracks().length > 0;
    const pc: RTCPeerConnection | null =
      (this.call as any)?.peerConnection ?? this.pc ?? null;

    // Disable video
    if (enable === false || (enable == null && hasVideo)) {
      const currentVideoTracks = this.local.getVideoTracks();
      try {
        if (pc) {
          const videoSenders = pc
            .getSenders()
            .filter((s) => s.track?.kind === 'video');
          for (const s of videoSenders) {
            try {
              pc.removeTrack(s);
            } catch {}
          }
        }
      } catch {}
      for (const t of currentVideoTracks) {
        try {
          t.stop();
        } catch {}
        try {
          this.local.removeTrack(t);
        } catch {}
      }
      await this.restartMediaCall();
      return;
    }

    // Enable video
    const cam = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 426, max: 640 },
        height: { ideal: 240, max: 360 },
        frameRate: { ideal: 12, max: 15 },
      },
      audio: false,
    });
    const camTrack = cam.getVideoTracks()[0];
    if (!camTrack) return;

    // Update local stream
    try {
      this.local.addTrack(camTrack);
    } catch {}

    // Attach to RTCPeerConnection
    try {
      if (pc) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(camTrack);
        } else {
          pc.addTrack(camTrack, this.local);
        }
      }
    } catch {}
    await this.restartMediaCall();
  }

  private async restartMediaCall(): Promise<void> {
    if (!this.peer || !this.local) return;
    try {
      this.call?.close();
    } catch {}
    try {
      const newCall = this.peer.call(this.otherId, this.local);
      this.call = newCall;
      newCall.on('stream', (remote) => this.events.onRemoteStream?.(remote));
      newCall.on('error', (e) => this.events.onError?.(e.message));
      this.pc = (newCall as any)?.peerConnection ?? this.pc;
    } catch (e: any) {
      this.events.onError?.(e?.message ?? 'Failed to restart call');
    }
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

  // Expose RTCPeerConnection safely for read-only access (e.g., stats)
  public getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  private ensureSecureContextOrThrow(): void {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.localhost');
    const secure = window.isSecureContext || isLocal;
    if (!secure) {
      const msg =
        'Camera/mic access requires HTTPS or http://localhost. Open this page over HTTPS.';
      this.events.onError?.(msg);
      throw new Error(msg);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg =
        'Camera/mic not available: navigator.mediaDevices.getUserMedia is undefined in this context.';
      this.events.onError?.(msg);
      throw new Error(msg);
    }
  }

  private formatGetUserMediaError(err: any): string {
    const name: string = err?.name ?? 'Error';
    switch (name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Permission denied. Please allow camera and microphone access in your browser settings.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera or microphone found. Connect a device and try again.';
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return 'Requested media constraints are not supported by your device.';
      case 'SecurityError':
        return 'Access blocked by browser security policy. Use HTTPS or http://localhost.';
      default:
        return err?.message ?? 'Failed to access camera/microphone.';
    }
  }
}
