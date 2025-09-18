import { TextAttributes } from '@opentui/core';
import type { RiskLevel, SymptomAnswers, UrgencyLevel } from '../types';

interface Props {
  urgency?: UrgencyLevel;
  risk?: RiskLevel;
  answers: SymptomAnswers;
  onProceedDoctor: () => void;
  onProceedAI: () => void;
}

export function PreTriage({
  urgency,
  risk,
  answers,
  onProceedDoctor,
  onProceedAI,
}: Props) {
  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>Pre-triage</text>
      <box border padding={1}>
        <text>
          Urgency: {urgency ?? 'Unknown'}
          {'\n'}
          Risk: {risk ?? 'Unknown'}
          {'\n'}
          Main Symptom: {answers.mainSymptom ?? '-'}
          {'\n'}
          Duration: {answers.duration ?? '-'}
          {'\n'}
          Severity: {answers.severity ?? '-'}
        </text>
      </box>
      <box border padding={1}>
        <text>1 Doctor Queue{'\n'}2 AI Consultation</text>
      </box>
      <text attributes={TextAttributes.DIM}>0 Back · 1-2 Select</text>
      {/* Routing driven by parent via keyboard */}
    </box>
  );
}
