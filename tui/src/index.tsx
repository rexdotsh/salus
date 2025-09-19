import { render } from '@opentui/react';
import { App } from './App';
import { setConvexUrl } from './services/convex';

function parseSessionToken(argv: string[]): string | null {
  const idx = argv.indexOf('-t');
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  for (const arg of argv) {
    if (arg.startsWith('--token=')) return arg.slice('--token='.length);
  }
  return null;
}

function parseConvexUrl(argv: string[]): string | null {
  const idx = argv.indexOf('--url');
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  for (const arg of argv) {
    if (arg.startsWith('--url=')) return arg.slice('--url='.length);
  }
  return null;
}

const argv = process.argv.slice(2);
const sessionToken = parseSessionToken(argv);
const convexUrl = parseConvexUrl(argv);
if (convexUrl) setConvexUrl(convexUrl);
render(<App sessionToken={sessionToken ?? undefined} />);
