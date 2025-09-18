import { useKeyboard } from '@opentui/react';
import { useCallback, useEffect, useState } from 'react';
import type { AppState, ScreenKey, UrgencyLevel } from './types';
import {
  detectConnectionStatus,
  getDoctorAvailability,
} from './services/status';
import { loadSession, saveSession } from './services/storage';
import { assessRisk } from './utils/risk';

const initialState: AppState = {
  screen: 'WELCOME',
  stack: [],
  connection: detectConnectionStatus(),
  doctor: getDoctorAvailability(),
  queuePosition: null,
  triage: {
    urgency: undefined,
    risk: undefined,
    stepIndex: 0,
    answers: {},
  },
  chat: { messages: [] },
  prescription: { items: [] },
  summary: null,
};

export function useAppRouter() {
  const stored = loadSession();
  const [state, setState] = useState<AppState>(() => {
    if (stored) {
      return {
        ...initialState,
        triage: stored.triage,
        summary: stored.summary,
      };
    }
    return initialState;
  });

  const push = useCallback((next: ScreenKey) => {
    setState((s) => ({ ...s, stack: [...s.stack, s.screen], screen: next }));
  }, []);

  const replace = useCallback((next: ScreenKey) => {
    setState((s) => ({ ...s, screen: next }));
  }, []);

  const back = useCallback(() => {
    setState((s) => {
      const prev = s.stack[s.stack.length - 1];
      if (!prev) return s;
      return { ...s, screen: prev, stack: s.stack.slice(0, -1) };
    });
  }, []);

  const emergency = useCallback(() => {
    setState((s) => ({
      ...s,
      stack: [...s.stack, s.screen],
      screen: 'EMERGENCY',
      triage: { ...s.triage, urgency: 'Emergency' },
    }));
  }, []);

  const setUrgency = useCallback((urgency: UrgencyLevel) => {
    setState((s) => {
      const risk = assessRisk(s.triage.answers, urgency);
      return { ...s, triage: { ...s.triage, urgency, risk } };
    });
  }, []);

  const updateAnswers = useCallback(
    (partial: Partial<AppState['triage']['answers']>) => {
      setState((s) => {
        const answers = { ...s.triage.answers, ...partial };
        const risk = assessRisk(answers, s.triage.urgency);
        return { ...s, triage: { ...s.triage, answers, risk } };
      });
    },
    [],
  );

  const setQueue = useCallback((position: number | null) => {
    setState((s) => ({ ...s, queuePosition: position }));
  }, []);

  const setTriageStepIndex = useCallback((next: number) => {
    setState((s) => ({ ...s, triage: { ...s.triage, stepIndex: next } }));
  }, []);

  const sendMessage = useCallback((text: string) => {
    setState((s) => ({
      ...s,
      chat: {
        messages: [
          ...s.chat.messages,
          { role: 'user', content: text },
          { role: 'assistant', content: '(AI reply stub)' },
        ],
      },
    }));
  }, []);

  const generateSummary = useCallback(() => {
    setState((s) => {
      const a = s.triage.answers;
      const lines = [
        `Dx: ${a.mainSymptom ?? 'General'}`,
        `Sx: ${[
          a.mainSymptom,
          a.duration,
          a.severity ? `sev${a.severity}` : undefined,
        ]
          .filter(Boolean)
          .join(' ')}`,
        `Adv: fluids rest paracetamol`,
        `FU: 48h or worse`,
      ];
      const sms = lines.join(' | ').slice(0, 160);
      return {
        ...s,
        summary: {
          diagnosis: a.mainSymptom ?? 'General advice',
          symptoms: [
            ...(a.mainSymptom ? [a.mainSymptom] : []),
            ...(a.duration ? [a.duration] : []),
            ...(a.fever ? ['fever'] : []),
          ],
          medications: s.prescription.items.map((it) => it.name),
          advice: 'Drink fluids, rest, monitor symptoms.',
          followUp: 'Follow up in 48 hours or sooner if worse.',
          smsCompressed: sms,
        },
      };
    });
  }, []);

  useKeyboard((key) => {
    if (key.sequence === '0') back();
    if (key.sequence === '!') emergency();
  });

  useEffect(() => {
    saveSession({
      lastUpdated: Date.now(),
      triage: state.triage,
      summary: state.summary,
    });
  }, [state.triage, state.summary]);

  return {
    state,
    push,
    replace,
    back,
    emergency,
    setUrgency,
    updateAnswers,
    setQueue,
    setTriageStepIndex,
    sendMessage,
    generateSummary,
  };
}
