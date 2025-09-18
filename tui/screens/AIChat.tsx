import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useEffect, useState } from 'react';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onFinish: () => void;
}

export function AIChat({ messages, onSend, onFinish }: Props) {
  const [input, setInput] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);

  function getLayoutMetrics() {
    const termCols =
      typeof process !== 'undefined' &&
      (process as any).stdout &&
      (process as any).stdout.columns
        ? ((process as any).stdout.columns as number)
        : 80;
    const termRows =
      typeof process !== 'undefined' &&
      (process as any).stdout &&
      (process as any).stdout.rows
        ? ((process as any).stdout.rows as number)
        : 24;

    const overheadRows = 15;
    const chatBoxTotalHeight = Math.max(8, termRows - overheadRows);

    const maxContentLines = Math.max(1, chatBoxTotalHeight - 4);

    const innerWidth = Math.max(10, termCols - 8);
    return { innerWidth, maxContentLines, chatBoxTotalHeight };
  }

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
    if (key.name === 'up') {
      setScrollOffset((o) => o + 1);
      return;
    }
    if (key.name === 'down') {
      setScrollOffset((o) => Math.max(0, o - 1));
      return;
    }
    if (key.name === 'pageup') {
      setScrollOffset((o) => o + 10);
      return;
    }
    if (key.name === 'pagedown') {
      setScrollOffset((o) => Math.max(0, o - 10));
      return;
    }
    if (key.name === 'home') {
      setScrollOffset(Number.MAX_SAFE_INTEGER);
      return;
    }
    if (key.name === 'end') {
      setScrollOffset(0);
      return;
    }

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
      setScrollOffset(0);
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

  useEffect(() => {
    const { maxContentLines } = getLayoutMetrics();
    const allLines: Array<string> = [];
    const { innerWidth } = getLayoutMetrics();
    for (const m of messages) {
      const prefix =
        m.role === 'user' ? '> ' : m.role === 'assistant' ? 'AI: ' : '';
      const wrapped = wrapTextWithPrefix(m.content, innerWidth, prefix);
      for (const line of wrapped.split('\n')) allLines.push(line);
    }
    const maxOffset = Math.max(0, allLines.length - maxContentLines);
    setScrollOffset((o) => Math.min(o, maxOffset));
  }, [messages]);

  return (
    <box flexDirection="column" flexGrow={1} padding={1} gap={1}>
      <text attributes={TextAttributes.BOLD}>AI Consultation</text>
      {(() => {
        const { chatBoxTotalHeight } = getLayoutMetrics();
        return (
          <box border padding={1} height={chatBoxTotalHeight}>
            {messages.length === 0 ? (
              <text attributes={TextAttributes.DIM}>No messages yet</text>
            ) : (
              <box>
                {(() => {
                  const { innerWidth, maxContentLines } = getLayoutMetrics();

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

                  const maxOffset = Math.max(
                    0,
                    allLines.length - maxContentLines,
                  );
                  const clampedOffset = Math.min(scrollOffset, maxOffset);
                  const start = Math.max(
                    0,
                    allLines.length - maxContentLines - clampedOffset,
                  );
                  const end = Math.min(
                    allLines.length,
                    start + maxContentLines,
                  );
                  const visible = allLines.slice(start, end);
                  const text = visible.join('\n');
                  return <text>{text}</text>;
                })()}
              </box>
            )}
          </box>
        );
      })()}
      <box border padding={1}>
        {(() => {
          const { innerWidth } = getLayoutMetrics();
          const prefix = 'Input: ';
          const maxLen = Math.max(1, innerWidth - prefix.length);
          let shown = input;
          if (shown.length > maxLen) {
            shown = `…${shown.slice(-(maxLen - 1))}`;
          }
          return (
            <text>
              {prefix}
              {shown}
            </text>
          );
        })()}
      </box>
      <text attributes={TextAttributes.DIM}>
        0 Back · Enter Send · 9 Finish · ↑/↓ Scroll · PgUp/PgDn · Home/End
      </text>
    </box>
  );
}
