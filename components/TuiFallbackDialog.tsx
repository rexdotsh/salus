'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
};

export function TuiFallbackDialog({ open, onOpenChange, sessionId }: Props) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const sshCommand = `ssh tui.salus.rex.wf -t ${sessionId}${url ? ` --url=${url}` : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Use TUI fallback</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If video/audio is unstable, connect to our ultra-low-bandwidth
            terminal chat. Paste this command in your terminal:
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={sshCommand} className="font-mono" />
            <Button onClick={() => navigator.clipboard.writeText(sshCommand)}>
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This opens a secure, text-only chat for session{' '}
            <span className="font-mono text-foreground">{sessionId}</span>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
