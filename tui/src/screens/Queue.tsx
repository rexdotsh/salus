import { TextAttributes } from '@opentui/core';
import { useEffect, useRef, useState } from 'react';
import type { DoctorAvailability } from '../types';
import {
  createConvexClient,
  startQueuePolling,
  type SessionStatus,
} from '../services/convex';

interface Props {
  doctor: DoctorAvailability;
  position: number | null;
  onSwitchToAI: () => void;
  sessionId?: string;
  onEnterChat?: () => void;
}

export function Queue({
  doctor,
  position,
  onSwitchToAI,
  sessionId,
  onEnterChat,
}: Props) {
  const [status, setStatus] = useState<SessionStatus>('waiting');
  const [pos, setPos] = useState<number | null>(position);
  const stopRef = useRef<{ stop: () => void } | null>(null);
  const enteredRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    const client = createConvexClient();
    stopRef.current = startQueuePolling(
      client,
      sessionId,
      ({ status, position }) => {
        setStatus(status);
        setPos(position);
      },
      1500,
    );
    return () => stopRef.current?.stop();
  }, [sessionId]);

  useEffect(() => {
    if (!enteredRef.current && (status === 'in_call' || status === 'claimed')) {
      enteredRef.current = true;
      onEnterChat?.();
    }
  }, [status, onEnterChat]);

  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>Doctor Queue</text>
      <box border padding={1}>
        <text>
          Doctor:{' '}
          {status === 'in_call'
            ? 'Connected'
            : status === 'claimed'
              ? 'Assigned'
              : 'Not connected'}
          {'\n'}
          Your position: {pos ?? '-'}
          {'\n'}
          Status: {status}
        </text>
      </box>
      <box border padding={1}>
        <text>1 Switch to AI now</text>
      </box>
      <text attributes={TextAttributes.DIM}>0 Back · 1 Switch</text>
    </box>
  );
}
