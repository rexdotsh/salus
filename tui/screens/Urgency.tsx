import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import type { UrgencyLevel } from '../types';

interface Props {
  onSelect: (u: UrgencyLevel) => void;
}

export function Urgency({ onSelect }: Props) {
  useKeyboard((key) => {
    if (key.sequence === '1') onSelect('Emergency');
    if (key.sequence === '2') onSelect('Urgent');
    if (key.sequence === '3') onSelect('Routine');
  });

  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>
        How urgent is your situation?
      </text>
      <box border padding={1}>
        <text>
          1 Emergency (life-threatening){'\n'}2 Urgent (hours){'\n'}3 Routine
          (days)
        </text>
      </box>
      <text attributes={TextAttributes.DIM}>Use 1-3 to choose · 0 Back</text>
    </box>
  );
}
