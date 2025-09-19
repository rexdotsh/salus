import { TextAttributes } from '@opentui/core';

interface Props {
  onStart: () => void;
  onEmergency: () => void;
}

export function Welcome({ onStart, onEmergency }: Props) {
  return (
    <box flexDirection="column" padding={2} gap={1} alignItems="center">
      <ascii-font font="tiny" text="SALUS" />
      <text attributes={TextAttributes.BOLD}>Telemedicine, simplified</text>
      <text>Start a consultation or get instant AI guidance.</text>
      <box border padding={1} width={50}>
        <text>1 Start consultation{'\n'}! Emergency</text>
      </box>
      <text attributes={TextAttributes.DIM}>
        Press 1 to begin · ! for emergency
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
