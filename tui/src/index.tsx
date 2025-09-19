import { render } from '@opentui/react';
import { App } from './App';

function parseSessionToken(argv: string[]): string | null {
  const idx = argv.indexOf('-t');
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  for (const arg of argv) {
    if (arg.startsWith('--token=')) return arg.slice('--token='.length);
  }
  return null;
}

const sessionToken = parseSessionToken(process.argv.slice(2));
render(<App sessionToken={sessionToken ?? undefined} />);
