import { useKeyboard } from '@opentui/react';
import { useAppRouter } from './router';
import { Emergency } from './screens/Emergency';
import { AIChat } from './screens/AIChat';
import { PreTriage } from './screens/PreTriage';
import { Prescription } from './screens/Prescription';
import { Queue } from './screens/Queue';
import { Summary } from './screens/Summary';
import { Symptoms, SYMPTOMS_TOTAL_STEPS } from './screens/Symptoms';
import { Urgency } from './screens/Urgency';
import { Welcome } from './screens/Welcome';

export function App() {
  const router = useAppRouter();
  const { state } = router;

  useKeyboard((key) => {
    if (state.screen === 'WELCOME') {
      if (key.sequence === '1') router.push('SYMPTOMS');
    } else if (state.screen === 'URGENCY') {
      if (key.sequence === '1')
        router.setUrgency('Emergency'),
          router.setTriageStepIndex(0),
          router.push('SYMPTOMS');
      if (key.sequence === '2')
        router.setUrgency('Urgent'),
          router.setTriageStepIndex(0),
          router.push('SYMPTOMS');
      if (key.sequence === '3')
        router.setUrgency('Routine'),
          router.setTriageStepIndex(0),
          router.push('SYMPTOMS');
    } else if (state.screen === 'SYMPTOMS') {
    } else if (state.screen === 'PRE_TRIAGE') {
      if (key.sequence === '1') router.push('QUEUE');
      if (key.sequence === '2') router.push('AI_CHAT');
    } else if (state.screen === 'QUEUE') {
      if (key.sequence === '1') router.replace('AI_CHAT');
    } else if (state.screen === 'AI_CHAT') {
      if (key.sequence === '9') router.push('PRESCRIPTION');
    } else if (state.screen === 'PRESCRIPTION') {
      if (key.sequence === '1')
        router.generateSummary(), router.push('SUMMARY');
    }
  });

  function onSymptomsNext() {
    const nextStep = state.triage.stepIndex + 1;
    if (nextStep >= SYMPTOMS_TOTAL_STEPS) {
      router.replace('PRE_TRIAGE');
    } else {
      router.setTriageStepIndex(nextStep);
    }
  }

  function onSend(text: string) {
    router.sendMessage(text);
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <box padding={1} flexGrow={1}>
        {state.screen === 'WELCOME' && (
          <Welcome
            onStart={() => router.push('SYMPTOMS')}
            onEmergency={router.emergency}
          />
        )}
        {state.screen === 'URGENCY' && (
          <Urgency onSelect={(u) => router.setUrgency(u)} />
        )}
        {state.screen === 'SYMPTOMS' && (
          <Symptoms
            step={state.triage.stepIndex}
            answers={state.triage.answers}
            onChange={(p) => router.updateAnswers(p)}
            onNext={onSymptomsNext}
            onBack={router.back}
          />
        )}
        {state.screen === 'PRE_TRIAGE' && (
          <PreTriage
            urgency={state.triage.urgency}
            risk={state.triage.risk}
            answers={state.triage.answers}
            onProceedDoctor={() => router.push('QUEUE')}
            onProceedAI={() => router.push('AI_CHAT')}
          />
        )}
        {state.screen === 'QUEUE' && (
          <Queue
            doctor={state.doctor}
            position={state.queuePosition}
            onSwitchToAI={() => router.replace('AI_CHAT')}
          />
        )}
        {state.screen === 'AI_CHAT' && (
          <AIChat
            messages={state.chat.messages}
            onSend={onSend}
            onFinish={() => router.push('PRESCRIPTION')}
          />
        )}
        {state.screen === 'PRESCRIPTION' && (
          <Prescription
            items={state.prescription.items}
            onProceedSummary={() => (
              router.generateSummary(), router.push('SUMMARY')
            )}
          />
        )}
        {state.screen === 'SUMMARY' && state.summary && (
          <Summary summary={state.summary} />
        )}
        {state.screen === 'EMERGENCY' && (
          <Emergency onStartAI={() => router.push('AI_CHAT')} />
        )}
      </box>
    </box>
  );
}
