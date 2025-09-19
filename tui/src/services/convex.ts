import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

export type SessionMessage = {
  sender: 'doctor' | 'patient';
  text: string;
};

let convexUrlOverride: string | null = null;
export function setConvexUrl(url: string) {
  convexUrlOverride = url;
}

function getConvexUrl(): string {
  if (convexUrlOverride) return convexUrlOverride;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) throw new Error('Convex URL not set (NEXT_PUBLIC_CONVEX_URL)');
  return url;
}

export function createConvexClient() {
  const url = getConvexUrl();
  return new ConvexHttpClient(url);
}

export async function enqueueToQueue(
  client: ReturnType<typeof createConvexClient>,
  params: {
    sessionId: string;
    triage: {
      category: string;
      urgency: 'routine' | 'urgent' | 'emergency';
      language: string;
      symptoms: string;
    };
  },
) {
  await client.mutation(api.index.enqueueSession, {
    sessionId: params.sessionId,
    triage: params.triage,
  });
}

export async function setSessionStatus(
  client: ReturnType<typeof createConvexClient>,
  sessionId: string,
  status: 'waiting' | 'claimed' | 'in_call' | 'ended',
) {
  try {
    await client.mutation(api.index.setSessionStatus, { sessionId, status });
  } catch {
    // ignore
  }
}

export async function sendSessionMessage(
  client: ReturnType<typeof createConvexClient>,
  sessionId: string,
  sender: 'doctor' | 'patient',
  text: string,
) {
  await client.mutation(api.index.sendMessage, { sessionId, sender, text });
}

export function startMessagesPolling(
  client: ReturnType<typeof createConvexClient>,
  sessionId: string,
  onUpdate: (messages: Array<SessionMessage>) => void,
  intervalMs = 1000,
) {
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const tick = async () => {
    if (stopped) return;
    try {
      const rows = await client.query(api.index.listMessages, { sessionId });
      const mapped: Array<SessionMessage> = rows.map((r) => ({
        sender: r.sender === 'doctor' ? 'doctor' : 'patient',
        text: r.text,
      }));
      onUpdate(mapped);
    } catch {
      // ignore transient errors
    } finally {
      if (!stopped) timer = setTimeout(tick, intervalMs);
    }
  };

  tick();

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export type SessionStatus = 'waiting' | 'claimed' | 'in_call' | 'ended';

export function startQueuePolling(
  client: ReturnType<typeof createConvexClient>,
  sessionId: string,
  onUpdate: (info: { status: SessionStatus; position: number | null }) => void,
  intervalMs = 1000,
) {
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const tick = async () => {
    if (stopped) return;
    try {
      const session = await client.query(api.index.getSession, { sessionId });
      const status = (session?.status ?? 'waiting') as SessionStatus;
      let position: number | null = null;
      try {
        const queue = await client.query(api.index.listQueue, {});
        const idx = queue.findIndex((s) => s.sessionId === sessionId);
        position = idx >= 0 ? idx + 1 : null;
      } catch {}
      onUpdate({ status, position });
    } catch {
      // ignore
    } finally {
      if (!stopped) timer = setTimeout(tick, intervalMs);
    }
  };

  tick();

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
