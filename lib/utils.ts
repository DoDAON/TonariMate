import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 조 이름 표시: 기본 이름("N조")이 아닌 경우 "N조 - 이름" 형식으로 반환
 */
export function formatTeamName(teamNumber: number, name: string): string {
  const defaultName = `${teamNumber}조`;
  return name === defaultName ? name : `${defaultName} - ${name}`;
}

/**
 * 종료일이 지났거나 status가 completed면 'completed', 아니면 'active'
 */
export function getEffectiveMissionStatus(
  status: 'active' | 'completed',
  endDate: string
): 'active' | 'completed' {
  if (status === 'completed') return 'completed';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today ? 'completed' : 'active';
}
