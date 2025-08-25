// Task status constants and utilities

export const TASK_STATUSES = {
  TODO: 0,
  IN_PROGRESS: 1,
  DONE: 2,
  REJECTED: 3,
  COMPLETED: 4,
} as const;

export const TASK_STATUS_LABELS = {
  [TASK_STATUSES.TODO]: 'To Do',
  [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
  [TASK_STATUSES.DONE]: 'Done',
  [TASK_STATUSES.REJECTED]: 'Rejected',
  [TASK_STATUSES.COMPLETED]: 'Completed',
} as const;

export const TASK_STATUS_COLORS = {
  [TASK_STATUSES.TODO]: 'bg-gray-100 text-gray-800',
  [TASK_STATUSES.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TASK_STATUSES.DONE]: 'bg-green-100 text-green-800',
  [TASK_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
  [TASK_STATUSES.COMPLETED]: 'bg-purple-100 text-purple-800',
} as const;

export const TASK_PRIORITY_LEVELS = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
} as const;

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY_LEVELS.LOW]: 'Low',
  [TASK_PRIORITY_LEVELS.MEDIUM]: 'Medium',
  [TASK_PRIORITY_LEVELS.HIGH]: 'High',
  [TASK_PRIORITY_LEVELS.URGENT]: 'Urgent',
} as const;

export const TASK_PRIORITY_COLORS = {
  [TASK_PRIORITY_LEVELS.LOW]: 'bg-gray-100 text-gray-800',
  [TASK_PRIORITY_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [TASK_PRIORITY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800',
  [TASK_PRIORITY_LEVELS.URGENT]: 'bg-red-100 text-red-800',
} as const;

export const TASK_IMPORTANCE_LEVELS = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const;

export const TASK_IMPORTANCE_LABELS = {
  [TASK_IMPORTANCE_LEVELS.LOW]: 'Low',
  [TASK_IMPORTANCE_LEVELS.NORMAL]: 'Normal',
  [TASK_IMPORTANCE_LEVELS.HIGH]: 'High',
  [TASK_IMPORTANCE_LEVELS.CRITICAL]: 'Critical',
} as const;

export const TASK_IMPORTANCE_COLORS = {
  [TASK_IMPORTANCE_LEVELS.LOW]: 'bg-gray-100 text-gray-800',
  [TASK_IMPORTANCE_LEVELS.NORMAL]: 'bg-blue-100 text-blue-800',
  [TASK_IMPORTANCE_LEVELS.HIGH]: 'bg-purple-100 text-purple-800',
  [TASK_IMPORTANCE_LEVELS.CRITICAL]: 'bg-red-100 text-red-800',
} as const;

export interface TaskStatusTransition {
  from: number;
  to: number;
  allowed: boolean;
  label: string;
}

export const TASK_STATUS_TRANSITIONS: TaskStatusTransition[] = [
  { from: TASK_STATUSES.TODO, to: TASK_STATUSES.IN_PROGRESS, allowed: true, label: 'Start Task' },
  { from: TASK_STATUSES.TODO, to: TASK_STATUSES.REJECTED, allowed: true, label: 'Reject Task' },
  { from: TASK_STATUSES.IN_PROGRESS, to: TASK_STATUSES.TODO, allowed: true, label: 'Move Back to To Do' },
  { from: TASK_STATUSES.IN_PROGRESS, to: TASK_STATUSES.DONE, allowed: true, label: 'Mark as Done' },
  { from: TASK_STATUSES.IN_PROGRESS, to: TASK_STATUSES.REJECTED, allowed: true, label: 'Reject Task' },
  { from: TASK_STATUSES.DONE, to: TASK_STATUSES.IN_PROGRESS, allowed: true, label: 'Reopen Task' },
  { from: TASK_STATUSES.DONE, to: TASK_STATUSES.COMPLETED, allowed: true, label: 'Mark as Completed' },
  { from: TASK_STATUSES.REJECTED, to: TASK_STATUSES.TODO, allowed: true, label: 'Reopen Task' },
  { from: TASK_STATUSES.COMPLETED, to: TASK_STATUSES.IN_PROGRESS, allowed: true, label: 'Reopen Task' },
];

export function getAllowedStatusTransitions(currentStatus: number): TaskStatusTransition[] {
  return TASK_STATUS_TRANSITIONS.filter(transition => transition.from === currentStatus && transition.allowed);
}

export function getStatusLabel(status: number): string {
  return TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] || 'Unknown';
}

export function getStatusColor(status: number): string {
  return TASK_STATUS_COLORS[status as keyof typeof TASK_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
}

export function getPriorityLabel(priority: number): string {
  return TASK_PRIORITY_LABELS[priority as keyof typeof TASK_PRIORITY_LABELS] || 'Unknown';
}

export function getPriorityColor(priority: number): string {
  return TASK_PRIORITY_COLORS[priority as keyof typeof TASK_PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';
}

export function getImportanceLabel(importance: number): string {
  return TASK_IMPORTANCE_LABELS[importance as keyof typeof TASK_IMPORTANCE_LABELS] || 'Unknown';
}

export function getImportanceColor(importance: number): string {
  return TASK_IMPORTANCE_COLORS[importance as keyof typeof TASK_IMPORTANCE_COLORS] || 'bg-gray-100 text-gray-800';
}

export function formatTimeEstimate(days?: number, hours?: number, minutes?: number): string {
  const parts: string[] = [];
  
  if (days && days > 0) {
    parts.push(`${days}d`);
  }
  
  if (hours && hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes && minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  return parts.length > 0 ? parts.join(' ') : 'No estimate';
}

export function calculateProgressPercentage(requirements: { isDone: boolean }[]): number {
  if (requirements.length === 0) return 0;
  
  const completed = requirements.filter(req => req.isDone).length;
  return Math.round((completed / requirements.length) * 100);
}

export function isTaskOverdue(endDateTime?: Date | null): boolean {
  if (!endDateTime) return false;
  return new Date() > endDateTime;
}

export function getTaskStatusBadge(status: number): JSX.Element {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function getTaskPriorityBadge(priority: number): JSX.Element {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
      {getPriorityLabel(priority)}
    </span>
  );
}

export function getTaskImportanceBadge(importance: number): JSX.Element {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(importance)}`}>
      {getImportanceLabel(importance)}
    </span>
  );
}