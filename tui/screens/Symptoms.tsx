import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { useState } from 'react';
import type { SymptomAnswers } from '../types';

interface Props {
  step: number;
  answers: SymptomAnswers;
  onChange: (partial: Partial<SymptomAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const STEPS = [
  'Main concern',
  'Duration',
  'Onset',
  'Severity',
  'Fever',
  'Age group',
  'Pregnancy',
  'Red flag: chest pain/pressure',
  'Red flag: severe shortness of breath',
  'Red flag: unconsciousness/confusion',
  'Red flag: uncontrolled bleeding',
];

export const SYMPTOMS_TOTAL_STEPS = STEPS.length;

export function Symptoms({ step, answers, onChange, onNext, onBack }: Props) {
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  useKeyboard((key) => {
    if (key.sequence === '0') {
      onBack();
      return;
    }
    if (step === 0 && customMode) {
      const seq = key.sequence;
      const name = (key as any).name as string | undefined;
      if (name === 'return' || seq === '\r' || seq === '\n') {
        const value = customText.trim();
        if (value) {
          onChange({ mainSymptom: 'Other', otherDetails: value });
          setCustomMode(false);
          setCustomText('');
          onNext();
        }
        return;
      }
      if (name === 'escape' || seq === '\u001b') {
        setCustomMode(false);
        setCustomText('');
        return;
      }
      if (name === 'backspace' || seq === '\u007f') {
        setCustomText((s) => s.slice(0, -1));
        return;
      }
      if (
        typeof seq === 'string' &&
        seq.length === 1 &&
        seq >= ' ' &&
        seq <= '~'
      ) {
        setCustomText((s) => (s + seq).slice(0, 60));
      }
      return;
    }

    switch (step) {
      case 0:
        if (key.sequence === '1') onChange({ mainSymptom: 'Fever' }), onNext();
        if (key.sequence === '2') onChange({ mainSymptom: 'Cough' }), onNext();
        if (key.sequence === '3')
          onChange({ mainSymptom: 'Headache' }), onNext();
        if (key.sequence === '4')
          onChange({ mainSymptom: 'Chest pain' }), onNext();
        if (key.sequence === '5')
          onChange({ mainSymptom: 'Abdominal pain' }), onNext();
        if (key.sequence === '6')
          onChange({ mainSymptom: 'Shortness of breath' }), onNext();
        if (key.sequence === '7')
          onChange({ mainSymptom: 'Vomiting/Diarrhea' }), onNext();
        if (key.sequence === '8') onChange({ mainSymptom: 'Rash' }), onNext();
        if (key.sequence === '9')
          onChange({ mainSymptom: 'Injury/Trauma' }), onNext();
        if (key.sequence?.toLowerCase() === 'o') setCustomMode(true);
        break;
      case 1:
        if (key.sequence === '1') onChange({ duration: 'hours' }), onNext();
        if (key.sequence === '2') onChange({ duration: 'days' }), onNext();
        if (key.sequence === '3') onChange({ duration: 'weeks' }), onNext();
        if (key.sequence === '4') onChange({ duration: 'months' }), onNext();
        break;
      case 2:
        if (key.sequence === '1') onChange({ onset: 'sudden' }), onNext();
        if (key.sequence === '2') onChange({ onset: 'gradual' }), onNext();
        break;
      case 3:
        if (['1', '2', '3', '4', '5'].includes(key.sequence)) {
          onChange({ severity: Number(key.sequence) as 1 | 2 | 3 | 4 | 5 });
          onNext();
        }
        break;
      case 4:
        if (key.sequence === '1') onChange({ fever: true }), onNext();
        if (key.sequence === '2') onChange({ fever: false }), onNext();
        break;
      case 5:
        if (key.sequence === '1') onChange({ ageGroup: 'infant' }), onNext();
        if (key.sequence === '2') onChange({ ageGroup: 'child' }), onNext();
        if (key.sequence === '3') onChange({ ageGroup: 'adult' }), onNext();
        if (key.sequence === '4') onChange({ ageGroup: 'elder' }), onNext();
        break;
      case 6:
        if (key.sequence === '1') onChange({ pregnant: true }), onNext();
        if (key.sequence === '2') onChange({ pregnant: false }), onNext();
        if (key.sequence === '3') onNext();
        break;
      case 7:
        if (key.sequence === '1')
          onChange({ redFlagChestPain: true }), onNext();
        if (key.sequence === '2')
          onChange({ redFlagChestPain: false }), onNext();
        break;
      case 8:
        if (key.sequence === '1')
          onChange({ redFlagBreathing: true }), onNext();
        if (key.sequence === '2')
          onChange({ redFlagBreathing: false }), onNext();
        break;
      case 9:
        if (key.sequence === '1')
          onChange({ redFlagUnconscious: true }), onNext();
        if (key.sequence === '2')
          onChange({ redFlagUnconscious: false }), onNext();
        break;
      case 10:
        if (key.sequence === '1') onChange({ redFlagBleeding: true }), onNext();
        if (key.sequence === '2')
          onChange({ redFlagBleeding: false }), onNext();
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
            What is your main concern?{'\n'}1 Fever · 2 Cough · 3 Headache · 4
            Chest pain · 5 Abdominal pain · 6 Shortness of breath · 7
            Vomiting/Diarrhea · 8 Rash · 9 Injury/Trauma · O Other
          </text>
        </box>
      )}
      {step === 0 && customMode && (
        <box border padding={1}>
          <text>
            Type your symptom (Enter to confirm · Esc to cancel):{' '}
            {customText || '_'}
          </text>
        </box>
      )}
      {step === 1 && (
        <box border padding={1}>
          <text>
            How long have you had this?{'\n'}1 Hours · 2 Days · 3 Weeks · 4
            Months
          </text>
        </box>
      )}
      {step === 2 && (
        <box border padding={1}>
          <text>How did it start?{'\n'}1 Sudden · 2 Gradual</text>
        </box>
      )}
      {step === 3 && (
        <box border padding={1}>
          <text>
            Rate your severity (1-5):{'\n'}1 Mild · 2 Moderate · 3 Significant ·
            4 Severe · 5 Extreme
          </text>
        </box>
      )}
      {step === 4 && (
        <box border padding={1}>
          <text>Do you have fever?{'\n'}1 Yes · 2 No</text>
        </box>
      )}
      {step === 5 && (
        <box border padding={1}>
          <text>
            Age group:{'\n'}1 Infant · 2 Child · 3 Adult · 4 Older adult
          </text>
        </box>
      )}
      {step === 6 && (
        <box border padding={1}>
          <text>Are you pregnant?{'\n'}1 Yes · 2 No · 3 Not applicable</text>
        </box>
      )}
      {step === 7 && (
        <box border padding={1}>
          <text>Severe chest pain or pressure?{'\n'}1 Yes · 2 No</text>
        </box>
      )}
      {step === 8 && (
        <box border padding={1}>
          <text>Severe shortness of breath?{'\n'}1 Yes · 2 No</text>
        </box>
      )}
      {step === 9 && (
        <box border padding={1}>
          <text>
            Fainting, unconsciousness, or confusion?{'\n'}1 Yes · 2 No
          </text>
        </box>
      )}
      {step === 10 && (
        <box border padding={1}>
          <text>Uncontrolled bleeding?{'\n'}1 Yes · 2 No</text>
        </box>
      )}
      <text attributes={TextAttributes.DIM}>0 Back · 1-9 Select</text>
    </box>
  );
}
