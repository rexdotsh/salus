'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type Props = {
  sessionId: string;
  readOnly?: boolean;
};

export function NotesPanel({ sessionId, readOnly = false }: Props) {
  const storageKey = `salus:session:${sessionId}:notes`;
  const [notes, setNotes] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const serverNotes = useQuery(api.index.getNotes, { sessionId });
  const saveNotes = useMutation(api.index.upsertNotes);

  useEffect(() => {
    const existing = localStorage.getItem(storageKey);
    if (existing) setNotes(existing);
  }, [storageKey]);

  useEffect(() => {
    if (serverNotes?.body && !notes) {
      setNotes(serverNotes.body);
    }
  }, [serverNotes, notes]);

  async function save() {
    if (readOnly) return;
    localStorage.setItem(storageKey, notes);
    await saveNotes({ sessionId, body: notes });
    setSavedAt(Date.now());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          placeholder="Clinical notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-40"
          readOnly={readOnly}
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {readOnly
              ? 'View only'
              : savedAt
                ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
                : 'Not saved'}
          </div>
          {!readOnly && (
            <Button onClick={save} variant="secondary">
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
