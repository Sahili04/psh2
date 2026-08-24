import { TransactionPriority } from '../types/domain.js';

const PRIORITY_MAP: Record<string, number> = {
  [TransactionPriority.EMERGENCY]: 4,
  [TransactionPriority.CRITICAL]: 3,
  [TransactionPriority.URGENT]: 2,
  [TransactionPriority.ROUTINE]: 1,
};

export function getPriorityScore(priority: string): number {
  return PRIORITY_MAP[priority.toUpperCase()] || 1;
}

export function comparePriority(priorityA: string, priorityB: string): number {
  return getPriorityScore(priorityA) - getPriorityScore(priorityB);
}

export function isHigherPriority(newPriority: string, existingPriority: string): boolean {
  return comparePriority(newPriority, existingPriority) > 0;
}
