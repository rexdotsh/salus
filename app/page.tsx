import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="text-lg font-semibold">Salus</span>
            <span className="text-xs text-muted-foreground">
              Telemedicine for low bandwidth
            </span>
          </Link>
          <Button asChild variant="secondary">
            <Link href="/doctor">Doctor portal</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">See a doctor now</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                Reliable consultations optimized for high-latency and
                low-bandwidth connections.
              </p>
              <Button asChild size="lg" className="h-16 w-full text-base">
                <Link href="/patient">I am a patient</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Fast, resilient</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Audio-first with graceful video fallback. If connectivity drops,
              switch to our TUI chat.
            </CardContent>
          </Card>
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Privacy-aware</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Minimal data by default. Optional transcription and summaries with
              consent.
            </CardContent>
          </Card>
        </div>
      </section>

      <Button
        asChild
        variant="destructive"
        size="lg"
        className="fixed bottom-4 right-4 rounded-full shadow-lg"
        aria-label="Emergency consult"
        title="Emergency consult"
      >
        <Link href="/emergency">Emergency</Link>
      </Button>
    </main>
  );
}
