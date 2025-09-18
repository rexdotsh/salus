import { TextAttributes } from '@opentui/core';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onFinish: () => void;
}

export function AIChat({ messages, onSend, onFinish }: Props) {
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
        <text>
          1 Say: "My pain is 3/5"{'\n'}2 Say: "Any medicine?"{'\n'}9 Finish
        </text>
      </box>
      <text attributes={TextAttributes.DIM}>
        0 Back · 1-2 Send preset · 9 Finish
      </text>
    </box>
  );
}
