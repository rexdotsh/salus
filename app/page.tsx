import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/salus.png"
              alt=""
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <Button asChild variant="secondary">
            <Link href="/doctor">Doctor portal</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Healthcare that <br />
            <span className="bg-gradient-to-r from-primary via-accent-foreground to-destructive bg-clip-text text-transparent">
              works everywhere
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reliable consultations for high-latency, low-bandwidth connections.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">See a doctor now</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                Get started with a consultation right away.
              </p>
              <Button asChild size="lg" className="h-16 w-full text-base">
                <Link href="/patient">I am a patient</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-lg">
                Or connect via SSH on low-bandwidth connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                <code>ssh tui.salus.rex.wf</code>
              </pre>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Button
              asChild
              variant="destructive"
              size="lg"
              className="px-20 py-9 text-xl font-semibold rounded-full"
              aria-label="Emergency consult"
              title="Emergency consult - Skip onboarding, direct doctor connection"
            >
              <Link href="/emergency">Emergency</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
