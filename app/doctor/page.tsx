'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { authClient } from '@/lib/auth-client';

export default function DoctorPortalPage() {
  const router = useRouter();
  const [available, setAvailable] = useState(false);

  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (!isPending && !session?.user) router.replace('/doctor/login');
  }, [isPending, session, router]);

  if (isPending || !session?.user) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Doctor portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push('/doctor/queue')}
              >
                Go to queue
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await authClient.signOut();
                  } catch {}
                  router.replace('/doctor/login');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
