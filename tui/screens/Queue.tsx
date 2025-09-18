import { TextAttributes } from '@opentui/core';
import type { DoctorAvailability } from '../types';

interface Props {
  doctor: DoctorAvailability;
  position: number | null;
  onSwitchToAI: () => void;
}

export function Queue({ doctor, position, onSwitchToAI }: Props) {
  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>Doctor Queue</text>
      <box border padding={1}>
        <text>
          Doctor: {doctor}
          {'\n'}
          Your position: {position ?? '-'}
        </text>
      </box>
      <box border padding={1}>
        <text>1 Switch to AI now</text>
      </box>
      <text attributes={TextAttributes.DIM}>0 Back · 1 Switch</text>
    </box>
  );
}
