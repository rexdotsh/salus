import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';

interface Props {
  onStartAI: () => void;
}

export function Emergency({ onStartAI }: Props) {
  useKeyboard((key) => {
    if (key.sequence === '1') onStartAI();
  });
  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>EMERGENCY</text>
      <box border padding={1}>
        <text>
          Please seek immediate help. If possible, call local emergency
          services.{'\n'}
          Keep the patient safe and monitor breathing.
        </text>
      </box>
      <box border padding={1}>
        <text>1 Start AI assistant now</text>
      </box>
      <text attributes={TextAttributes.DIM}>0 Back · 1 AI</text>
    </box>
  );
}
