import type { RiskLevel, SymptomAnswers, UrgencyLevel } from '../types';

export function assessRisk(
  answers: SymptomAnswers,
  urgency?: UrgencyLevel,
): RiskLevel {
  if (urgency === 'Emergency') return 'Emergency';
  const severity = answers.severity ?? 3;
  if (severity >= 5) return 'Emergency';
  if (severity >= 4) return 'Urgent';
  if (
    answers.fever &&
    (answers.ageGroup === 'infant' || answers.ageGroup === 'elder')
  )
    return 'Urgent';
  return 'Routine';
}
