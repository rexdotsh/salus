import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createConvexClient,
  sendSessionMessage,
  setSessionStatus,
  startMessagesPolling,
  type SessionMessage,
} from '../services/convex';

interface Props {
  sessionId: string;
  role: 'doctor' | 'patient';
  onExit?: () => void;
}

export function SessionChat({ sessionId, role, onExit }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<SessionMessage>>([]);
  const clientRef = useRef<ReturnType<typeof createConvexClient> | null>(null);
  const stopRef = useRef<{ stop: () => void } | null>(null);

  const title = useMemo(() => {
    return role === 'doctor'
      ? 'Doctor ↔ Patient (TUI)'
      : 'Patient ↔ Doctor (TUI)';
  }, [role]);

  useEffect(() => {
    const client = createConvexClient();
    clientRef.current = client;
    void setSessionStatus(client, sessionId, 'in_call');
    stopRef.current = startMessagesPolling(
      client,
      sessionId,
      setMessages,
      1000,
    );
    return () => {
      stopRef.current?.stop();
      clientRef.current = null;
    };
  }, [sessionId]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    const client = clientRef.current;
    if (!client) return;
    await sendSessionMessage(client, sessionId, role, text);
    setInput('');
  }

  useKeyboard((key) => {
    if (
      key.name === 'return' ||
      key.name === 'enter' ||
      key.sequence === '\r' ||
      key.sequence === '\n'
    ) {
      void handleSend();
      return;
    }

    if (
      key.name === 'backspace' ||
      key.sequence === '\x7f' ||
      key.sequence === '\b'
    ) {
      setInput((v) => (v.length > 0 ? v.slice(0, -1) : v));
      return;
    }

    const seq = key.sequence ?? '';
    if (seq.length !== 1) return;
    if (!/[\x20-\x7E]/.test(seq)) return;
    setInput((v) => v + seq);
  });

  function getLayoutMetrics() {
    const termCols = (process as any)?.stdout?.columns ?? 80;
    const termRows = (process as any)?.stdout?.rows ?? 24;
    const overheadRows = 10;
    const chatBoxTotalHeight = Math.max(8, termRows - overheadRows);
    const maxContentLines = Math.max(1, chatBoxTotalHeight - 4);
    const innerWidth = Math.max(10, termCols - 8);
    return { innerWidth, maxContentLines, chatBoxTotalHeight };
  }

  function wrapTextWithPrefix(text: string, maxWidth: number, prefix: string) {
    const lines: Array<string> = [];
    const indent = ' '.repeat(prefix.length);
    const safeWidth = Math.max(10, maxWidth);
    for (const para of text.split('\n')) {
      let current = prefix;
      let isFirst = true;
      const words = para.split(/\s+/).filter((w) => w.length > 0);
      if (words.length === 0) {
        lines.push(current.trimEnd());
        continue;
      }
      for (const word of words) {
        const candidate =
          (current.length > 0
            ? current + (current.endsWith(' ') ? '' : ' ')
            : isFirst
              ? prefix
              : indent) + word;
        if (candidate.length <= safeWidth) {
          current = candidate;
        } else {
          lines.push(current.trimEnd());
          current = indent + word;
        }
        isFirst = false;
      }
      if (current.trim().length > 0) lines.push(current.trimEnd());
    }
    return lines.join('\n');
  }

  return (
    <box flexDirection="column" flexGrow={1} padding={1} gap={1}>
      <text attributes={TextAttributes.BOLD}>{title}</text>
      <box
        border
        padding={1}
        height={(() => getLayoutMetrics().chatBoxTotalHeight)()}
      >
        {(() => {
          const { innerWidth, maxContentLines } = getLayoutMetrics();
          const allLines: Array<string> = [];
          for (const m of messages) {
            const prefix = m.sender === 'doctor' ? 'Dr: ' : 'Pt: ';
            const wrapped = wrapTextWithPrefix(m.text, innerWidth, prefix);
            for (const line of wrapped.split('\n')) allLines.push(line);
          }
          const start = Math.max(0, allLines.length - maxContentLines);
          const visible = allLines.slice(start);
          const text = visible.join('\n');
          return <text>{text || 'No messages yet'}</text>;
        })()}
      </box>
      <box>
        <text>Input: </text>
        <text>{input}</text>
      </box>
      <box gap={2}>
        <text>Enter to send · Ctrl+C to exit</text>
      </box>
    </box>
  );
}
