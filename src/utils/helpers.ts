import { format, parseISO, startOfDay, endOfDay, subWeeks, subMonths } from 'date-fns';
import type { Exercise, WorkoutSet, MacroTargets } from '../types';

export function formatDate(date: Date | string, pattern = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function formatWeight(weight: number, unit: 'kg' | 'lb' = 'kg'): string {
  return `${weight.toFixed(1)} ${unit}`;
}

export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function calculateVolume(sets: WorkoutSet[]): number {
  return sets
    .filter(s => !s.isWarmup && s.isCompleted)
    .reduce((sum, s) => sum + s.reps * s.weight, 0);
}

export function calculateTotalReps(sets: WorkoutSet[]): number {
  return sets
    .filter(s => !s.isWarmup && s.isCompleted)
    .reduce((sum, s) => sum + s.reps, 0);
}

export function getMuscleGroupColor(muscleGroup: Exercise['muscleGroup']): string {
  const colors: Record<Exercise['muscleGroup'], string> = {
    chest: '#ef4444',
    back: '#3b82f6',
    shoulders: '#f97316',
    arms: '#a855f7',
    legs: '#22c55e',
    core: '#eab308',
    cardio: '#06b6d4',
    full_body: '#6366f1',
  };
  return colors[muscleGroup] || '#64748b';
}

export function getMuscleGroupLabel(muscleGroup: Exercise['muscleGroup']): string {
  const labels: Record<Exercise['muscleGroup'], string> = {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    arms: 'Arms',
    legs: 'Legs',
    core: 'Core',
    cardio: 'Cardio',
    full_body: 'Full Body',
  };
  return labels[muscleGroup] || muscleGroup;
}

export function getEquipmentIcon(equipment: Exercise['equipment']): string {
  const icons: Record<Exercise['equipment'], string> = {
    barbell: '🏋️',
    dumbbell: '🏋️‍♀️',
    machine: '🏭',
    cable: '🔗',
    bodyweight: '🤸',
    kettlebell: '🎯',
    bands: '🟰',
    other: '📦',
  };
  return icons[equipment] || '📦';
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

export function calculateTDEE(bmr: number, activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'): number {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}

export function calculateMacroTargets(
  calories: number,
  goal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'recomp'
): MacroTargets {
  let proteinRatio = 0.3;
  let fatRatio = 0.25;
  let carbRatio = 0.45;

  switch (goal) {
    case 'lose_weight':
      proteinRatio = 0.35;
      fatRatio = 0.3;
      carbRatio = 0.35;
      break;
    case 'gain_muscle':
      proteinRatio = 0.3;
      fatRatio = 0.25;
      carbRatio = 0.45;
      break;
    case 'recomp':
      proteinRatio = 0.35;
      fatRatio = 0.25;
      carbRatio = 0.4;
      break;
  }

  return {
    calories,
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  };
}

export function getDateRange(period: 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  let start: Date;
  switch (period) {
    case 'week':
      start = startOfDay(subWeeks(new Date(), 1));
      break;
    case 'month':
      start = startOfDay(subMonths(new Date(), 1));
      break;
    case 'quarter':
      start = startOfDay(subMonths(new Date(), 3));
      break;
    case 'year':
      start = startOfDay(subMonths(new Date(), 12));
      break;
  }
  return { start, end };
}

export function groupByDate<T extends { date: Date }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  items.forEach(item => {
    const key = format(startOfDay(item.date), 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return map;
}

export function getWeeklyAverage<T extends { date: Date; value: number }>(
  items: T[],
  weeks = 4
): { date: Date; average: number }[] {
  const byWeek = new Map<string, number[]>();
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekStart = startOfDay(subWeeks(now, i));
    const key = format(weekStart, 'yyyy-MM-dd');
    byWeek.set(key, []);
  }

  items.forEach(item => {
    const weekStart = startOfDay(subWeeks(item.date, 0));
    const key = format(weekStart, 'yyyy-MM-dd');
    if (byWeek.has(key)) {
      byWeek.get(key)!.push(item.value);
    }
  });

  const result: { date: Date; average: number }[] = [];
  byWeek.forEach((values, key) => {
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      result.push({ date: parseISO(key), average: Math.round(avg * 10) / 10 });
    }
  });

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}