'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  category: z.string().min(1, 'Select a category'),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  language: z.string().min(1, 'Select a language'),
  symptoms: z.string().min(1, 'Please describe your issue'),
  consent: z.boolean().refine((v) => v === true, 'Consent is required'),
});

type FormValues = z.infer<typeof schema>;

function generateSessionId(): string {
  // 24-char base36 for brevity and readability
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => (b % 36).toString(36))
    .join('');
}

export default function PatientQuestionnairePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const enqueue = useMutation(api.index.enqueueSession);
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Basics', blurb: 'Category & urgency' },
    { title: 'Details', blurb: 'Language & symptoms' },
    { title: 'Confirm', blurb: 'Consent & review' },
  ] as const;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: '',
      urgency: 'routine',
      language: 'en',
      symptoms: '',
      consent: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const sessionId = generateSessionId();
      const { category, urgency, language, symptoms } = values;
      await enqueue({
        sessionId,
        triage: { category, urgency, language, symptoms },
      });
      router.push(`/session/${sessionId}/waiting`);
    } finally {
      setSubmitting(false);
    }
  }

  const stepFields: Array<Array<keyof FormValues>> = [
    ['category', 'urgency'],
    ['language', 'symptoms'],
    ['consent'],
  ];

  async function next() {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    if (step === 0) {
      history.back();
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  }

  const progressValue = Math.round(((step + 1) / steps.length) * 100);

  return (
    <main className="mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-8">
      <Card className="border-border bg-card text-card-foreground min-w-96 w-full">
        <CardHeader>
          <CardTitle>Get care in minutes</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer a few quick questions so we can route you appropriately.
          </p>
          <div className="mt-4">
            <Progress value={progressValue} />
          </div>
          <ol className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <li key={s.title} className="flex items-center gap-3">
                  <div
                    className={
                      isDone
                        ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm aspect-square'
                        : isActive
                          ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary shadow-sm aspect-square'
                          : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground aspect-square'
                    }
                  >
                    {isDone ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{i + 1}</span>
                    )}
                  </div>
                  <div
                    className={
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }
                  >
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs">{s.blurb}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardHeader>
        <Separator />
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDownCapture={(e) => {
                if (e.key === 'Enter' && step !== steps.length - 1) {
                  e.preventDefault();
                  void next();
                }
              }}
              className="space-y-6"
            >
              {step === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-3 md:grid-cols-4"
                          >
                            {[
                              { value: 'general', label: 'General' },
                              { value: 'dermatology', label: 'Dermatology' },
                              { value: 'respiratory', label: 'Respiratory' },
                              {
                                value: 'mental_health',
                                label: 'Mental health',
                              },
                            ].map((opt) => {
                              const id = `category-${opt.value}`;
                              const selected = field.value === opt.value;
                              return (
                                <div key={opt.value} className="relative">
                                  <RadioGroupItem
                                    id={id}
                                    value={opt.value}
                                    className="sr-only"
                                  />
                                  <Label
                                    htmlFor={id}
                                    className={cn(
                                      'flex cursor-pointer select-none items-center justify-center rounded-md border p-3 text-sm transition-colors',
                                      selected
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'hover:bg-accent/40',
                                    )}
                                  >
                                    {opt.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-3 gap-3"
                          >
                            {[
                              { value: 'routine', label: 'Routine' },
                              { value: 'urgent', label: 'Urgent' },
                              { value: 'emergency', label: 'Emergency' },
                            ].map((opt) => {
                              const id = `urgency-${opt.value}`;
                              const selected = field.value === opt.value;
                              return (
                                <div key={opt.value} className="relative">
                                  <RadioGroupItem
                                    id={id}
                                    value={opt.value}
                                    className="sr-only"
                                  />
                                  <Label
                                    htmlFor={id}
                                    className={cn(
                                      'flex cursor-pointer select-none items-center justify-center rounded-md border p-3 text-sm transition-colors',
                                      selected
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'hover:bg-accent/40',
                                    )}
                                  >
                                    {opt.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-3 md:grid-cols-4"
                          >
                            {[
                              { value: 'en', label: 'English' },
                              { value: 'hi', label: 'Hindi' },
                              { value: 'es', label: 'Spanish' },
                              { value: 'fr', label: 'French' },
                            ].map((opt) => {
                              const id = `language-${opt.value}`;
                              const selected = field.value === opt.value;
                              return (
                                <div key={opt.value} className="relative">
                                  <RadioGroupItem
                                    id={id}
                                    value={opt.value}
                                    className="sr-only"
                                  />
                                  <Label
                                    htmlFor={id}
                                    className={cn(
                                      'flex cursor-pointer select-none items-center justify-center rounded-md border p-3 text-sm transition-colors',
                                      selected
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'hover:bg-accent/40',
                                    )}
                                  >
                                    {opt.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe your issue</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground">
                          Keep it brief and specific.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <div className="rounded-md border p-4">
                    <div className="mb-3 text-sm font-medium">Review</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Category</dt>
                        <dd className="font-medium capitalize">
                          {form.getValues('category') || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Urgency</dt>
                        <dd className="font-medium capitalize">
                          {form.getValues('urgency') || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Language</dt>
                        <dd className="font-medium uppercase">
                          {form.getValues('language') || '—'}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Issue</dt>
                        <dd className="font-medium whitespace-pre-wrap">
                          {form.getValues('symptoms') || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <input
                            id="consent"
                            type="checkbox"
                            className="h-4 w-4 rounded border-input accent-primary"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <Label htmlFor="consent" className="leading-tight">
                            I consent to use this service and agree to the
                            privacy notice.
                          </Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="secondary" onClick={back}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={() => void next()}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
