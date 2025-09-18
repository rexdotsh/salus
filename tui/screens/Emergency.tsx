import { TextAttributes } from '@opentui/core';

export function Emergency() {
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
      <text attributes={TextAttributes.DIM}>Press 0 to go back</text>
    </box>
  );
}
