export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  instructions: string[];
  tips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  isCustom: boolean;
  createdBy?: string;
  createdAt: Date;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'bands'
  | 'other';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets: WorkoutSet[];
  order: number;
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rpe?: number;
  isCompleted: boolean;
  isWarmup: boolean;
  restTime?: number;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  notes?: string;
  isTemplate: boolean;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  days: PlanDay[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanDay {
  id: string;
  dayOfWeek: number; // 0-6
  workoutId: string;
  workout?: Workout;
  isRestDay: boolean;
  notes?: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  neck?: number;
  forearmLeft?: number;
  forearmRight?: number;
  notes?: string;
  createdAt: Date;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  oneRepMax: number;
  date: Date;
  createdAt: Date;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time?: Date;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface FoodItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isCustom: boolean;
  barcode?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: ActivityLevel;
  goal?: FitnessGoal;
  macroTargets?: MacroTargets;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type FitnessGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'recomp';