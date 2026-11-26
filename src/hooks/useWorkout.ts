import { useState, useCallback } from 'react';
import type { Workout, WorkoutSet, Exercise } from '../types';

export function useWorkout(initialWorkout?: Workout) {
  const [workout, setWorkout] = useState<Workout>(initialWorkout || {
    id: '',
    userId: '',
    name: '',
    exercises: [],
    isTemplate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [restTimer, setRestTimer] = useState<{ exerciseIndex: number; setIndex: number; duration: number } | null>(null);

  const addExercise = useCallback((exercise: Exercise) => {
    setWorkout(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exerciseId: exercise.id,
          exercise,
          sets: [{ id: crypto.randomUUID(), reps: 0, weight: 0, isCompleted: false, isWarmup: false }],
          order: prev.exercises.length,
        },
      ],
    }));
  }, []);

  const removeExercise = useCallback((index: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index).map((e, i) => ({ ...e, order: i })),
    }));
  }, []);

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setWorkout(prev => {
      const newExercises = [...prev.exercises];
      const [removed] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, removed);
      return { ...prev, exercises: newExercises.map((e, i) => ({ ...e, order: i })) };
    });
  }, []);

  const addSet = useCallback((exerciseIndex: number, isWarmup = false) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((e, i) =>
        i === exerciseIndex
          ? { ...e, sets: [...e.sets, { id: crypto.randomUUID(), reps: 0, weight: 0, isCompleted: false, isWarmup }] }
          : e
      ),
    }));
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((e, i) =>
        i === exerciseIndex ? { ...e, sets: e.sets.filter((_, si) => si !== setIndex) } : e
      ),
    }));
  }, []);

  const updateSet = useCallback((
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<WorkoutSet>
  ) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((e, i) =>
        i === exerciseIndex
          ? { ...e, sets: e.sets.map((s, si) => (si === setIndex ? { ...s, ...updates } : s)) }
          : e
      ),
    }));
  }, []);

  const toggleSetComplete = useCallback((exerciseIndex: number, setIndex: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((e, i) =>
        i === exerciseIndex
          ? { ...e, sets: e.sets.map((s, si) => (si === setIndex ? { ...s, isCompleted: !s.isCompleted } : s)) }
          : e
      ),
    }));
  }, []);

  const startWorkout = useCallback(() => {
    setIsActive(true);
    setStartTime(new Date());
    setActiveExerciseIndex(0);
  }, []);

  const completeWorkout = useCallback(() => {
    const completedAt = new Date();
    const duration = startTime ? Math.round((completedAt.getTime() - startTime.getTime()) / 1000 / 60) : 0;
    setWorkout(prev => ({
      ...prev,
      startedAt: startTime || new Date(),
      completedAt,
      duration,
    }));
    setIsActive(false);
  }, [startTime]);

  const pauseWorkout = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeWorkout = useCallback(() => {
    setIsActive(true);
  }, []);

  const startRestTimer = useCallback((exerciseIndex: number, setIndex: number, duration: number) => {
    setRestTimer({ exerciseIndex, setIndex, duration });
  }, []);

  const clearRestTimer = useCallback(() => {
    setRestTimer(null);
  }, []);

  const getExerciseVolume = useCallback((exerciseIndex: number) => {
    const ex = workout.exercises[exerciseIndex];
    if (!ex) return { volume: 0, sets: 0, reps: 0 };
    const workingSets = ex.sets.filter(s => !s.isWarmup && s.isCompleted);
    const volume = workingSets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    const reps = workingSets.reduce((sum, s) => sum + s.reps, 0);
    return { volume, sets: workingSets.length, reps };
  }, [workout.exercises]);

  const getTotalVolume = useCallback(() => {
    return workout.exercises.reduce((sum, _, i) => sum + getExerciseVolume(i).volume, 0);
  }, [workout.exercises, getExerciseVolume]);

  return {
    workout,
    setWorkout,
    activeExerciseIndex,
    setActiveExerciseIndex,
    isActive,
    startTime,
    restTimer,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    startWorkout,
    completeWorkout,
    pauseWorkout,
    resumeWorkout,
    startRestTimer,
    clearRestTimer,
    getExerciseVolume,
    getTotalVolume,
  };
}