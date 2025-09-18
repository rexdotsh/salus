'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function WaitingRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = useMemo(
    () => (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '',
    [params],
  );

  const session = useQuery(
    api.index.getSession,
    sessionId ? { sessionId } : 'skip',
  );

  useEffect(() => {
    if (!sessionId) return;
    if (
      session &&
      (session.status === 'claimed' || session.status === 'in_call')
    ) {
      router.push(`/session/${sessionId}`);
    }
  }, [session, sessionId, router]);

  const sshCommand = `ssh tui.salus.rex.wf -t ${sessionId}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Waiting room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Your session ID</p>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={sessionId} className="font-mono" />
              <Button
                type="button"
                onClick={() => navigator.clipboard.writeText(sessionId)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-border p-4">
            <p className="text-sm text-muted-foreground">
              If your connection is unstable, use our ultra-low-bandwidth TUI
              chat:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={sshCommand} className="font-mono" />
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(sshCommand)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => router.push(`/session/${sessionId}`)}>
              Go to call
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
