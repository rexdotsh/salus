'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type QueueItem = {
  sessionId: string;
  category: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  language: string;
};

export default function DoctorQueuePage() {
  // Placeholder client-side queue using sessionStorage for demo
  const [filterUrgency, setFilterUrgency] = useState<
    'all' | QueueItem['urgency']
  >('all');
  const [search, setSearch] = useState('');

  const queue = useQuery(api.index.listQueue, {});
  const claim = useMutation(api.index.claimSession);

  const items: Array<QueueItem> = (queue ?? []).map((s) => ({
    sessionId: s.sessionId,
    category: s.triage.category,
    urgency: s.triage.urgency,
    language: s.triage.language,
  }));

  const filtered = items.filter(
    (x) =>
      (filterUrgency === 'all' || x.urgency === filterUrgency) &&
      (search === '' || x.sessionId.includes(search)),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Patient queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <Select
                value={filterUrgency}
                onValueChange={(v) => setFilterUrgency(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Search by session id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No patients in queue yet.
              </div>
            ) : (
              filtered.map((q) => (
                <div
                  key={q.sessionId}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{q.sessionId}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.category} • {q.urgency} • {q.language}
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      await claim({
                        sessionId: q.sessionId,
                        doctorId: 'doctor-local',
                      });
                      location.href = `/session/${q.sessionId}`;
                    }}
                  >
                    Claim & Join
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
