import { TextAttributes } from '@opentui/core';
import { useMemo } from 'react';
import type { ConnectionStatus, DoctorAvailability } from '../types';

interface Props {
  connection: ConnectionStatus;
  doctor: DoctorAvailability;
  queuePosition: number | null;
}

export function StatusBar({ connection, doctor, queuePosition }: Props) {
  const connColor = useMemo(
    () =>
      connection === 'SSH'
        ? 'green'
        : connection === 'Offline'
          ? 'red'
          : 'yellow',
    [connection],
  );
  const docColor = useMemo(
    () =>
      doctor === 'Available' ? 'green' : doctor === 'Busy' ? 'yellow' : 'red',
    [doctor],
  );

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      height={1}
    >
      <text attributes={TextAttributes.DIM}>Salus TUI</text>
      <text>
        <span fg={connColor}>{connection}</span> | Doctor:{' '}
        <span fg={docColor}>{doctor}</span>
        {queuePosition != null ? ` | Queue: ${queuePosition}` : ''}
      </text>
      <text attributes={TextAttributes.DIM}>
        ! Emergency · 0 Back · 1-9 Select
      </text>
    </box>
  );
}
