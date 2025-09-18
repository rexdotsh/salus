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

  function wrapTextWithPrefix(
    text: string,
    maxWidth: number,
    prefix: string,
  ): string {
    const lines: Array<string> = [];
    const indent = ' '.repeat(prefix.length);
    const safeWidth = Math.max(10, maxWidth);

    const splitWord = (word: string, firstLine: boolean) => {
      const available = safeWidth - (firstLine ? prefix.length : indent.length);
      if (available <= 0) return [word];
      const chunks: Array<string> = [];
      for (let i = 0; i < word.length; i += available) {
        chunks.push(word.slice(i, i + available));
      }
      return chunks;
    };

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
          // If single word too long, split it into chunks
          if (
            word.length >
            safeWidth - (isFirst ? prefix.length : indent.length)
          ) {
            const pieces = splitWord(word, isFirst);
            for (let i = 0; i < pieces.length; i++) {
              const piece = pieces[i];
              const pre = isFirst ? prefix : indent;
              const line =
                current.trim().length > 0 && current !== pre
                  ? current
                  : pre + piece;
              if (line.length <= safeWidth) {
                if (current.trim().length > 0 && current !== pre) {
                  lines.push(current.trimEnd());
                  current = pre + piece;
                } else {
                  current = pre + piece;
                }
              } else {
                lines.push((pre + piece).slice(0, safeWidth));
                current = '';
              }
              if (i < pieces.length - 1) {
                lines.push(current.trimEnd());
                current = indent;
                isFirst = false;
              }
            }
          } else {
            lines.push(current.trimEnd());
            current = indent + word;
          }
        }
        isFirst = false;
      }
      if (current.trim().length > 0) lines.push(current.trimEnd());
    }
    return lines.join('\n');
  }

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
            {(() => {
              const termCols =
                typeof process !== 'undefined' &&
                (process as any).stdout &&
                (process as any).stdout.columns
                  ? ((process as any).stdout.columns as number)
                  : 80;
              const innerWidth = Math.max(10, termCols - 8);
              const CHAT_HEIGHT = 12;
              const maxContentLines = Math.max(1, CHAT_HEIGHT - 4);

              const allLines: Array<string> = [];
              for (const m of messages) {
                const prefix =
                  m.role === 'user'
                    ? '> '
                    : m.role === 'assistant'
                      ? 'AI: '
                      : '';
                const wrapped = wrapTextWithPrefix(
                  m.content,
                  innerWidth,
                  prefix,
                );
                for (const line of wrapped.split('\n')) allLines.push(line);
              }

              const visible = allLines.slice(-maxContentLines);
              const text = visible.join('\n');
              return <text>{text}</text>;
            })()}
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
