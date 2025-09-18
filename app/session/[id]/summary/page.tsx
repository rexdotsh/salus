'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SummaryPage() {
  const params = useParams<{ id: string }>();
  const sessionId = useMemo(
    () => (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '',
    [params],
  );

  // Placeholder: derive a basic summary from triage + chat-only (to be replaced with AI)
  const triageRaw =
    typeof window !== 'undefined'
      ? localStorage.getItem(`salus:session:${sessionId}:triage`)
      : null;
  const triage = triageRaw ? JSON.parse(triageRaw) : null;
  const notesRaw =
    typeof window !== 'undefined'
      ? localStorage.getItem(`salus:session:${sessionId}:notes`)
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Visit summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Session: {sessionId}
          </div>
          {triage ? (
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Category:</span> {triage.category}
              </div>
              <div>
                <span className="font-medium">Urgency:</span> {triage.urgency}
              </div>
              <div>
                <span className="font-medium">Language:</span> {triage.language}
              </div>
              <div>
                <span className="font-medium">Complaint:</span>{' '}
                {triage.symptoms}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No triage data found.
            </div>
          )}

          {notesRaw ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium">Doctor notes</div>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {notesRaw}
              </div>
            </div>
          ) : null}

          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            AI summary will appear here after the call. This will include key
            findings, advice, and red-flags.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            <Button onClick={() => history.back()}>Back</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
