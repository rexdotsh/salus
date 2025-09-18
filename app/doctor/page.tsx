'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function DoctorPortalPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [authed, setAuthed] = useState(false);
  const [available, setAvailable] = useState(false);

  function handleLogin() {
    // Placeholder auth; replace with proper auth later
    if (passcode.trim().length >= 4) setAuthed(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Doctor portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!authed ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passcode">Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  placeholder="Enter passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
              </div>
              <Button onClick={handleLogin}>Login</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="font-medium">Availability</div>
                  <div className="text-sm text-muted-foreground">
                    Show in queue as available to take patients
                  </div>
                </div>
                <Switch checked={available} onCheckedChange={setAvailable} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => router.push('/doctor/queue')}>
                  Go to queue
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
