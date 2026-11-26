import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';
import type { Exercise, Workout, WorkoutPlan, BodyMeasurement, PersonalRecord, NutritionEntry, FoodItem } from '../types';

interface AppContextType {
  exercises: Exercise[];
  workouts: Workout[];
  templates: Workout[];
  plans: WorkoutPlan[];
  activePlan: WorkoutPlan | null;
  measurements: BodyMeasurement[];
  personalRecords: PersonalRecord[];
  nutritionEntries: NutritionEntry[];
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
  refreshExercises: () => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshMeasurements: () => Promise<void>;
  refreshPersonalRecords: () => Promise<void>;
  refreshNutrition: (startDate?: Date, endDate?: Date) => Promise<void>;
  refreshFoods: () => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Promise<string>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  addTemplate: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  addPlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>) => Promise<string>;
  addPersonalRecord: (pr: Omit<PersonalRecord, 'id' | 'createdAt'>) => Promise<string>;
  upsertNutrition: (entry: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  addFood: (food: Omit<FoodItem, 'id'>) => Promise<string>;
  updateWorkout: (userId: string, workoutId: string, updates: Partial<Workout>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback;
    setError(message);
    console.error(fallback, err);
  };

  const refreshExercises = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await firestoreService.getExercises(user.uid);
      setExercises(data);
    } catch (err) {
      handleError(err, 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getWorkouts(user.uid);
      setWorkouts(data);
    } catch (err) {
      handleError(err, 'Failed to load workouts');
    }
  }, [user]);

  const refreshTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getWorkoutTemplates(user.uid);
      setTemplates(data);
    } catch (err) {
      handleError(err, 'Failed to load templates');
    }
  }, [user]);

  const refreshPlans = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getPlans(user.uid);
      setPlans(data);
      const active = await firestoreService.getActivePlan(user.uid);
      setActivePlan(active);
    } catch (err) {
      handleError(err, 'Failed to load plans');
    }
  }, [user]);

  const refreshMeasurements = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getMeasurements(user.uid);
      setMeasurements(data);
    } catch (err) {
      handleError(err, 'Failed to load measurements');
    }
  }, [user]);

  const refreshPersonalRecords = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getPersonalRecords(user.uid);
      setPersonalRecords(data);
    } catch (err) {
      handleError(err, 'Failed to load personal records');
    }
  }, [user]);

  const refreshNutrition = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!user) return;
    try {
      const data = await firestoreService.getNutritionEntries(user.uid, startDate, endDate);
      setNutritionEntries(data);
    } catch (err) {
      handleError(err, 'Failed to load nutrition entries');
    }
  }, [user]);

  const refreshFoods = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getFoods(user.uid);
      setFoods(data);
    } catch (err) {
      handleError(err, 'Failed to load foods');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshExercises();
      refreshWorkouts();
      refreshTemplates();
      refreshPlans();
      refreshMeasurements();
      refreshPersonalRecords();
      refreshNutrition();
      refreshFoods();
    } else {
      setExercises([]);
      setWorkouts([]);
      setTemplates([]);
      setPlans([]);
      setActivePlan(null);
      setMeasurements([]);
      setPersonalRecords([]);
      setNutritionEntries([]);
      setFoods([]);
    }
  }, [user, refreshExercises, refreshWorkouts, refreshTemplates, refreshPlans, refreshMeasurements, refreshPersonalRecords, refreshNutrition, refreshFoods]);

  const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.createExercise(user.uid, exercise);
    await refreshExercises();
    return id;
  };

  const addWorkout = async (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.createWorkout(user.uid, workout);
    await refreshWorkouts();
    return id;
  };

  const addTemplate = async (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.createWorkout(user.uid, { ...workout, isTemplate: true });
    await refreshTemplates();
    return id;
  };

  const addPlan = async (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.createPlan(user.uid, plan);
    await refreshPlans();
    return id;
  };

  const addMeasurement = async (measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.addMeasurement(user.uid, measurement);
    await refreshMeasurements();
    return id;
  };

  const addPersonalRecord = async (pr: Omit<PersonalRecord, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.addPersonalRecord(user.uid, pr);
    await refreshPersonalRecords();
    return id;
  };

  const upsertNutrition = async (entry: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.upsertNutritionEntry(user.uid, entry);
    await refreshNutrition();
    return id;
  };

  const addFood = async (food: Omit<FoodItem, 'id'>) => {
    if (!user) throw new Error('Not authenticated');
    const id = await firestoreService.createFood(user.uid, food);
    await refreshFoods();
    return id;
  };

  const updateWorkout = async (userId: string, workoutId: string, updates: Partial<Workout>) => {
    if (!user) throw new Error('Not authenticated');
    await firestoreService.updateWorkout(userId, workoutId, updates);
    await refreshWorkouts();
  };

  return (
    <AppContext.Provider
      value={{
        exercises,
        workouts,
        templates,
        plans,
        activePlan,
        measurements,
        personalRecords,
        nutritionEntries,
        foods,
        loading,
        error,
        refreshExercises,
        refreshWorkouts,
        refreshTemplates,
        refreshPlans,
        refreshMeasurements,
        refreshPersonalRecords,
        refreshNutrition,
        refreshFoods,
        addExercise,
        addWorkout,
        addTemplate,
        addPlan,
        addMeasurement,
        addPersonalRecord,
        upsertNutrition,
        addFood,
        updateWorkout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}