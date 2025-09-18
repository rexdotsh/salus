import { TextAttributes } from '@opentui/core';

interface Props {
  onStart: () => void;
  onEmergency: () => void;
}

export function Welcome({ onStart, onEmergency }: Props) {
  return (
    <box flexDirection="column" padding={2} gap={1}>
      <ascii-font font="tiny" text="Salus" />
      <text attributes={TextAttributes.BOLD}>Rural Telemedicine</text>
      <text>Connect to doctors or get AI guidance with low bandwidth.</text>
      <box border padding={1}>
        <text>1 Start Consultation{'\n'}! Emergency</text>
      </box>
      <text attributes={TextAttributes.DIM}>
        Press 1 to begin, ! for emergency
      </text>
      <HiddenKeypad
        onSelect={(n) => n === 1 && onStart()}
        onEmergency={onEmergency}
      />
    </box>
  );
}

function HiddenKeypad({
  onSelect,
  onEmergency,
}: { onSelect: (n: number) => void; onEmergency: () => void }) {
  return <text attributes={TextAttributes.DIM} />;
}
