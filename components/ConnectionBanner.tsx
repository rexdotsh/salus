'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  sessionId: string;
  getStats?: () => Promise<RTCStatsReport | null>;
  onForceAudioOnly?: () => void;
};

export function ConnectionBanner({
  sessionId,
  getStats,
  onForceAudioOnly,
}: Props) {
  const [loss, setLoss] = useState<number | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    const id = setInterval(async () => {
      try {
        const report = (await getStats?.()) ?? null;
        if (!report) return;
        let currentRtt: number | null = null;
        let currentLoss: number | null = null;
        report.forEach((s) => {
          if (s.type === 'candidate-pair' && (s as any).currentRoundTripTime) {
            currentRtt = Math.round(
              ((s as any).currentRoundTripTime ?? 0) * 1000,
            );
          }
          if (
            s.type === 'inbound-rtp' &&
            (s as any).packetsLost != null &&
            (s as any).packetsReceived != null
          ) {
            const lost = Number((s as any).packetsLost);
            const recv = Number((s as any).packetsReceived);
            const total = lost + recv;
            if (total > 0) currentLoss = Math.round((lost / total) * 100);
          }
        });
        if (!mounted) return;
        setRtt(currentRtt);
        setLoss(currentLoss);
        setShow(
          Boolean(currentRtt && currentRtt > 350) ||
            Boolean(currentLoss && currentLoss > 5),
        );
      } catch {}
    }, 4000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [getStats]);

  if (!show) return null;

  const sshCommand = `ssh tui.salus.rex.wf -t ${sessionId}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Connection is degraded{rtt ? ` (RTT ~ ${rtt}ms)` : ''}
          {loss != null ? `, loss ~ ${loss}%` : ''}. Consider switching to
          audio-only or use the TUI fallback:
          <span className="ml-2 font-mono text-foreground">{sshCommand}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onForceAudioOnly}>
            Audio-only
          </Button>
          <Button
            variant="default"
            onClick={() => navigator.clipboard.writeText(sshCommand)}
            title="Copy SSH command"
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
