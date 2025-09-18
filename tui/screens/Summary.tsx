import { TextAttributes } from '@opentui/core';
import type { SummaryData } from '../types';

interface Props {
  summary: SummaryData;
}

export function Summary({ summary }: Props) {
  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>Consultation Summary</text>
      <box border padding={1}>
        <text>
          Diagnosis: {summary.diagnosis}
          {'\n'}
          Symptoms: {summary.symptoms.join(', ')}
          {'\n'}
          Medications: {summary.medications.join(', ')}
          {'\n'}
          Advice: {summary.advice}
          {'\n'}
          Follow-up: {summary.followUp}
        </text>
      </box>
      <box border padding={1}>
        <text>
          SMS (&lt;=160):{'\n'}
          {summary.smsCompressed}
        </text>
      </box>
      <text attributes={TextAttributes.DIM}>0 Back</text>
    </box>
  );
}
