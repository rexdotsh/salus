import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import type { SymptomAnswers } from '../types';

interface Props {
  step: number;
  answers: SymptomAnswers;
  onChange: (partial: Partial<SymptomAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const STEPS = ['Main symptom', 'Duration', 'Severity', 'Fever', 'Age group'];

export function Symptoms({ step, answers, onChange, onNext }: Props) {
  useKeyboard((key) => {
    switch (step) {
      case 0:
        if (key.sequence === '1') onChange({ mainSymptom: 'Fever' }), onNext();
        if (key.sequence === '2') onChange({ mainSymptom: 'Cough' }), onNext();
        if (key.sequence === '3')
          onChange({ mainSymptom: 'Headache' }), onNext();
        break;
      case 1:
        if (key.sequence === '1') onChange({ duration: 'hours' }), onNext();
        if (key.sequence === '2') onChange({ duration: 'days' }), onNext();
        if (key.sequence === '3') onChange({ duration: 'weeks' }), onNext();
        break;
      case 2:
        if (['1', '2', '3', '4', '5'].includes(key.sequence)) {
          onChange({ severity: Number(key.sequence) as 1 | 2 | 3 | 4 | 5 });
          onNext();
        }
        break;
      case 3:
        if (key.sequence === '1') onChange({ fever: true }), onNext();
        if (key.sequence === '2') onChange({ fever: false }), onNext();
        break;
      case 4:
        if (key.sequence === '1') onChange({ ageGroup: 'infant' }), onNext();
        if (key.sequence === '2') onChange({ ageGroup: 'child' }), onNext();
        if (key.sequence === '3') onChange({ ageGroup: 'adult' }), onNext();
        if (key.sequence === '4') onChange({ ageGroup: 'elder' }), onNext();
        break;
    }
  });

  return (
    <box flexDirection="column" padding={2} gap={1}>
      <text attributes={TextAttributes.BOLD}>
        Symptoms — Step {step + 1} of {STEPS.length}
      </text>
      {step === 0 && (
        <box border padding={1}>
          <text>
            What is your main symptom?{'\n'}1 Fever / 2 Cough / 3 Headache
          </text>
        </box>
      )}
      {step === 1 && (
        <box border padding={1}>
          <text>
            How long have you had this?{'\n'}1 Hours / 2 Days / 3 Weeks
          </text>
        </box>
      )}
      {step === 2 && (
        <box border padding={1}>
          <text>
            Severity 1-5: {'\n'}1 :) 2 :| 3 :/ 4 :( 5 D:{'\n'}
            Choose 1-5
          </text>
        </box>
      )}
      {step === 3 && (
        <box border padding={1}>
          <text>Do you have fever?{'\n'}1 Yes / 2 No</text>
        </box>
      )}
      {step === 4 && (
        <box border padding={1}>
          <text>Age group:{'\n'}1 Infant / 2 Child / 3 Adult / 4 Elder</text>
        </box>
      )}
      <text attributes={TextAttributes.DIM}>0 Back · 1-9 Select</text>
    </box>
  );
}
