import type { RiskLevel, SymptomAnswers, UrgencyLevel } from '../types';

export function assessRisk(
  answers: SymptomAnswers,
  urgency?: UrgencyLevel,
): RiskLevel {
  if (urgency === 'Emergency') return 'Emergency';
  if (
    answers.redFlagChestPain ||
    answers.redFlagBreathing ||
    answers.redFlagUnconscious ||
    answers.redFlagBleeding
  )
    return 'Emergency';

  const severity = answers.severity ?? 3;
  if (severity >= 5) return 'Emergency';
  if (severity >= 4) return 'Urgent';

  if (
    answers.fever &&
    (answers.ageGroup === 'infant' || answers.ageGroup === 'elder')
  )
    return 'Urgent';

  if (answers.pregnant && answers.fever) return 'Urgent';

  if (
    answers.mainSymptom === 'Chest pain' ||
    answers.mainSymptom === 'Shortness of breath'
  )
    return 'Urgent';

  return 'Routine';
}
