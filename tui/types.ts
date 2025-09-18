export type ConnectionStatus = 'SSH' | 'Offline' | 'Unknown';

export type DoctorAvailability = 'Available' | 'Busy' | 'Offline';

export type ScreenKey =
  | 'WELCOME'
  | 'URGENCY'
  | 'SYMPTOMS'
  | 'PRE_TRIAGE'
  | 'QUEUE'
  | 'AI_CHAT'
  | 'PRESCRIPTION'
  | 'SUMARY'
  | 'EMERGENCY';

export type UrgencyLevel = 'Emergency' | 'Urgent' | 'Routine';
export type RiskLevel = UrgencyLevel;

export interface SymptomAnswers {
  mainSymptom?: string;
  duration?: 'hours' | 'days' | 'weeks';
  severity?: 1 | 2 | 3 | 4 | 5;
  fever?: boolean;
  ageGroup?: 'infant' | 'child' | 'adult' | 'elder';
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

  triage: TriageState;
  chat: { messages: ChatMessage[] };
  prescription: { items: PrescriptionItem[] };
  summary: SummaryData | null;
}

export interface StoredSession {
  lastUpdated: number;
  triage: TriageState;
  summary: SummaryData | null;
}
