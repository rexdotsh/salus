export type EngineEvents = {
  onConnected?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onData?: (data: string) => void;
  onError?: (message: string) => void;
};

export interface CallEngine {
  start(audioOnly?: boolean): Promise<MediaStream>;
  toggleVideo(enable?: boolean): Promise<void>;
  setMuted(muted: boolean): void;
  send(text: string): void;
  getStats(): Promise<RTCStatsReport | null>;
  close(): void;
}
