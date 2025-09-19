import { useKeyboard } from '@opentui/react';
import { useCallback, useEffect, useState } from 'react';
import type { AppState, ScreenKey, UrgencyLevel } from './types';
import {
  detectConnectionStatus,
  getDoctorAvailability,
} from './services/status';
import { loadSession, saveSession } from './services/storage';
import {
  generateAiReply,
  generateAiReplyStream,
  isAiConfigured,
} from './services/ai';
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
      screen: 'QUEUE',
      queuePosition: 0,
      triage: { ...s.triage, urgency: 'Emergency', risk: 'Emergency' },
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

  const sendMessage = useCallback(
    (text: string) => {
      let assistantIndex = -1;

      setState((s) => {
        const baseLen = s.chat.messages.length;
        assistantIndex = baseLen + 1;
        return {
          ...s,
          chat: {
            ...s.chat,
            messages: [
              ...s.chat.messages,
              { role: 'user' as const, content: text },
              { role: 'assistant' as const, content: '...' },
            ],
          },
        };
      });

      setTimeout(async () => {
        const useAi = isAiConfigured();
        if (!useAi) {
          setState((s) => {
            const msgs = s.chat.messages.slice();
            if (assistantIndex >= 0 && assistantIndex < msgs.length) {
              msgs[assistantIndex] = {
                role: 'assistant',
                content:
                  'AI not configured. Set VLLM_API_KEY and VLLM_BASE_URL.',
              };
            }
            return { ...s, chat: { ...s.chat, messages: msgs } };
          });
          return;
        }

        const a = state.triage.answers;
        const contextParts = [
          a.mainSymptom ? `Main: ${a.mainSymptom}` : undefined,
          a.otherDetails ? `Other: ${a.otherDetails}` : undefined,
          a.duration ? `Duration: ${a.duration}` : undefined,
          a.onset ? `Onset: ${a.onset}` : undefined,
          a.severity ? `Severity: ${a.severity}` : undefined,
          a.fever !== undefined
            ? `Fever: ${a.fever ? 'yes' : 'no'}`
            : undefined,
          a.ageGroup ? `Age: ${a.ageGroup}` : undefined,
          a.pregnant !== undefined
            ? `Pregnant: ${a.pregnant ? 'yes' : 'no'}`
            : undefined,
          a.redFlagChestPain ? 'RF: chest pain' : undefined,
          a.redFlagBreathing ? 'RF: severe SOB' : undefined,
          a.redFlagUnconscious ? 'RF: unconscious/confusion' : undefined,
          a.redFlagBleeding ? 'RF: bleeding' : undefined,
        ]
          .filter(Boolean)
          .join(' | ');

        const systemContext = contextParts
          ? [{ role: 'system' as const, content: `Triage: ${contextParts}` }]
          : [];

        const sourceMessages = [
          ...systemContext,
          ...state.chat.messages,
          { role: 'user' as const, content: text },
        ];
        let accumulated = '';

        try {
          await generateAiReplyStream(sourceMessages, {
            onToken: (delta) =>
              setState((s) => {
                accumulated += delta;
                const msgs = s.chat.messages.slice();
                if (assistantIndex >= 0 && assistantIndex < msgs.length) {
                  msgs[assistantIndex] = {
                    role: 'assistant',
                    content: accumulated,
                  };
                }
                return { ...s, chat: { ...s.chat, messages: msgs } };
              }),
          });

          if (!accumulated) {
            const reply = await generateAiReply(sourceMessages);
            setState((s) => {
              const msgs = s.chat.messages.slice();
              if (assistantIndex >= 0 && assistantIndex < msgs.length) {
                msgs[assistantIndex] = { role: 'assistant', content: reply };
              }
              return { ...s, chat: { ...s.chat, messages: msgs } };
            });
          }
        } catch {
          setState((s) => {
            const msgs = s.chat.messages.slice();
            if (assistantIndex >= 0 && assistantIndex < msgs.length) {
              msgs[assistantIndex] = {
                role: 'assistant',
                content: 'AI request failed.',
              };
            }
            return { ...s, chat: { ...s.chat, messages: msgs } };
          });
        }
      });
    },
    [state.chat.messages, state.triage.answers],
  );

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
