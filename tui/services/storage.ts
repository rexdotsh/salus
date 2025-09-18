import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

import type { StoredSession } from '../types';

const DIR = join(os.homedir(), '.salus-tui');
const FILE = join(DIR, 'session.json');

export function loadSession(): StoredSession | null {
  try {
    if (!existsSync(FILE)) return null;
    const raw = readFileSync(FILE, 'utf8');
    const data = JSON.parse(raw) as StoredSession;
    return data;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  try {
    if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(session, null, 2));
  } catch {}
}
