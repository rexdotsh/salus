import { TextAttributes } from '@opentui/core';
import type { PrescriptionItem } from '../types';

interface Props {
  items: PrescriptionItem[];
  onProceedSummary: () => void;
}

export function Prescription({ items, onProceedSummary }: Props) {
  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>Prescription (Preview)</text>
      <box border padding={1}>
        {items.length === 0 ? (
          <text>No medications yet</text>
        ) : (
          <box>
            {items.map((it, idx) => (
              <text key={idx}>
                - {it.name} {it.dosage} — {it.instructions}
                {'\n'}
              </text>
            ))}
          </box>
        )}
      </box>
      <box border padding={1}>
        <text>1 Generate Summary</text>
      </box>
      <text attributes={TextAttributes.DIM}>0 Back · 1 Continue</text>
    </box>
  );
}
