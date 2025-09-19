import type { ConnectionStatus, DoctorAvailability } from '../types';

export function detectConnectionStatus(): ConnectionStatus {
  const isSsh = Boolean(process.env.SSH_TTY || process.env.SSH_CONNECTION);
  if (isSsh) return 'SSH';
  return 'Unknown';
}

export function getDoctorAvailability(): DoctorAvailability {
  const minute = Math.floor(Date.now() / 60000);
  const mod = minute % 3;
  if (mod === 0) return 'Available';
  if (mod === 1) return 'Busy';
  return 'Offline';
}
