import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onFinish: () => void;
}

export function AIChat({ messages, onSend, onFinish }: Props) {
  const [input, setInput] = useState('');

  useKeyboard((key) => {
    if (key.sequence === '9') {
      onFinish();
      return;
    }

    if (
      key.name === 'return' ||
      key.name === 'enter' ||
      key.sequence === '\r' ||
      key.sequence === '\n'
    ) {
      const text = input.trim();
      if (text) onSend(text);
      setInput('');
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
    if (seq === '0') return;
    if (!/[\x20-\x7E]/.test(seq)) return;

    setInput((v) => v + seq);
  });

  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>AI Consultation</text>
      <box border padding={1} height={12}>
        {messages.length === 0 ? (
          <text attributes={TextAttributes.DIM}>No messages yet</text>
        ) : (
          <box>
            {messages.map((m, i) => (
              <text key={i}>
                {m.role === 'user'
                  ? '> '
                  : m.role === 'assistant'
                    ? 'AI: '
                    : ''}
                {m.content}
                {'\n'}
              </text>
            ))}
          </box>
        )}
      </box>
      <box border padding={1}>
        <text>Input: {input}</text>
      </box>
      <text attributes={TextAttributes.DIM}>
        0 Back · Enter Send · 9 Finish
      </text>
    </box>
  );
}
