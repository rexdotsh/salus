export type ConnectionStatus = 'SSH' | 'Offline' | 'Unknown';

export type DoctorAvailability = 'Available' | 'Busy' | 'Offline';

export type ScreenKey =
  | 'WELCOME'
  | 'URGENCY'
  | 'SYMPTOMS'
  | 'PRE_TRIAGE'
  | 'QUEUE'
  | 'SESSION_CHAT'
  | 'AI_CHAT'
  | 'PRESCRIPTION'
  | 'SUMMARY'
  | 'EMERGENCY';

export type UrgencyLevel = 'Emergency' | 'Urgent' | 'Routine';
export type RiskLevel = UrgencyLevel;

export interface SymptomAnswers {
  mainSymptom?: string;
  otherDetails?: string;
  duration?: 'hours' | 'days' | 'weeks' | 'months';
  onset?: 'sudden' | 'gradual';
  severity?: 1 | 2 | 3 | 4 | 5;
  fever?: boolean;
  ageGroup?: 'infant' | 'child' | 'adult' | 'elder';
  pregnant?: boolean;
  redFlagChestPain?: boolean;
  redFlagBreathing?: boolean;
  redFlagUnconscious?: boolean;
  redFlagBleeding?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  instructions: string;
}

export interface SummaryData {
  diagnosis: string;
  symptoms: string[];
  medications: string[];
  advice: string;
  followUp: string;
  smsCompressed: string;
}

export interface TriageState {
  urgency?: UrgencyLevel;
  risk?: RiskLevel;
  stepIndex: number;
  answers: SymptomAnswers;
}

export interface AppState {
  screen: ScreenKey;
  stack: ScreenKey[];
  connection: ConnectionStatus;
  doctor: DoctorAvailability;
  queuePosition: number | null;

  session?: { id: string; role: 'patient' | 'doctor' };

  triage: TriageState;
  chat: { messages: ChatMessage[] };
  prescription: { items: PrescriptionItem[] };
  summary: SummaryData | null;
}
