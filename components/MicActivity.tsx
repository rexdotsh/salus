'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  stream: MediaStream | null;
  className?: string;
};

// Simple mic activity indicator using Web Audio API.
// Shows a bar that grows with input volume and lights up when speaking.
export function MicActivity({ stream, className }: Props) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Cleanup any previous graph
    function cleanup() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      try {
        analyserRef.current?.disconnect();
      } catch {}
      try {
        sourceRef.current?.disconnect();
      } catch {}
      analyserRef.current = null;
      sourceRef.current = null;
      // Keep AudioContext alive across streams to avoid user gesture issues
    }

    cleanup();
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevel(0);
      return;
    }

    const ctx =
      ctxRef.current ??
      new (window.AudioContext || (window as any).webkitAudioContext)();
    ctxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.fftSize);
    const update = () => {
      analyser.getByteTimeDomainData(dataArray);
      // Compute a simple RMS from the time-domain data
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128; // -1..1
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length); // 0..1
      setLevel(rms);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cleanup();
    };
  }, [stream]);

  // Map level (0..~0.5 typical) to width percentage
  const intensity = Math.min(100, Math.round(level * 300));
  const speaking = level > 0.06; // heuristic

  return (
    <div
      className={className}
      aria-label="Microphone activity"
      title="Microphone activity"
    >
      <div className="flex items-center gap-2">
        <div
          className={
            'h-2 w-24 rounded-full bg-muted overflow-hidden border border-border'
          }
        >
          <div
            className={
              'h-full transition-[width,background-color] duration-150 ease-linear'
            }
            style={{
              width: `${intensity}%`,
              backgroundColor: speaking
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted-foreground))',
            }}
          />
        </div>
        <div
          className={
            speaking
              ? 'text-xs font-medium text-primary'
              : 'text-xs text-muted-foreground'
          }
        >
          {speaking ? 'Speaking' : 'Quiet'}
        </div>
      </div>
    </div>
  );
}
