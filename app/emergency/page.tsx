'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function generateSessionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => (b % 36).toString(36))
    .join('');
}

export default function EmergencyPage() {
  const router = useRouter();
  const enqueue = useMutation(api.index.enqueueSession);
  const [error, setError] = useState<string | null>(null);
  const [enqueuedSessionId, setEnqueuedSessionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionId = generateSessionId();
        setEnqueuedSessionId(sessionId);
        await enqueue({
          sessionId,
          triage: {
            category: 'general',
            urgency: 'emergency',
            language: 'en',
            symptoms: 'Emergency assistance requested',
          },
        });
        if (!cancelled) router.replace(`/session/${sessionId}/waiting`);
      } catch (e) {
        setError('Failed to start emergency session. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enqueue, router]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Starting emergency session…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <div className="text-sm text-destructive">{error}</div>
              <div className="flex gap-2">
                <Button onClick={() => router.replace('/')}>Go back</Button>
                {enqueuedSessionId ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      router.replace(`/session/${enqueuedSessionId}/waiting`)
                    }
                  >
                    Open waiting room
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Please wait while we place you at the front of the queue…
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
