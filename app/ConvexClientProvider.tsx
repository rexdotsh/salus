'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export default function ConvexClientProvider({
  children,
}: { children: ReactNode }) {
  const client = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || ''),
    [],
  );
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
