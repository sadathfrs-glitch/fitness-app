import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { calculateOneRepMax, getMuscleGroupColor } from '../utils/helpers';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout';
import { useDebounce } from '../hooks/useDebounce';
import type { Exercise, WorkoutExercise, WorkoutSet } from '../types';

export function WorkoutDetail() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { workouts, exercises, addWorkout, updateWorkout } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const workout = workouts.find(w => w.id === workoutId);
  const isNew = !workout;

  const {
    workout: localWorkout,
    setWorkout,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    getExerciseVolume,
    getTotalVolume,
  } = useWorkout(workout);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<Exercise['muscleGroup'] | 'all'>('all');
  const debouncedSearch = useDebounce(searchExercise, 300);

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesMuscle = selectedMuscleGroup === 'all' || e.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscle;
  });

  const handleSave = async () => {
    if (!user || !workoutId) return;
    const data = {
      name: localWorkout.name,
      description: localWorkout.description,
      exercises: localWorkout.exercises,
      isTemplate: false,
      userId: user.uid,
    };

    if (isNew) {
      await addWorkout(data);
    } else {
      await updateWorkout(user.uid, workoutId, data);
    }
    setShowSaveModal(false);
    navigate('/workouts');
  };

  if (!workout && !isNew) {
    return (
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Workout not found</h3>
            <Link to="/workouts">
              <Button>Back to Workouts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MUSCLE_GROUPS: { value: Exercise['muscleGroup'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'arms', label: 'Arms' },
    { value: 'legs', label: 'Legs' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'full_body', label: 'Full Body' },
  ];

  return (
    <div className="pt-20 px-4 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isNew ? 'New Workout' : workout!.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isNew ? 'Create your workout' : `${workout!.exercises.length} exercises • ${workout!.completedAt ? 'Completed' : 'Draft'}`}
          </p>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="outline" onClick={() => setShowSaveModal(true)}>
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowSaveModal(true)}>
            <Copy className="w-4 h-4" />
            Save as Template
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            label="Workout Name"
            value={localWorkout.name}
            onChange={e => setWorkout({ ...localWorkout, name: e.target.value })}
            placeholder="e.g., Push Day A"
          />
          <Input
            label="Description (optional)"
            value={localWorkout.description || ''}
            onChange={e => setWorkout({ ...localWorkout, description: e.target.value })}
            placeholder="Notes about this workout..."
            className="mt-4"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exercises ({localWorkout.exercises.length})</CardTitle>
            <Button size="sm" onClick={() => setShowExerciseModal(true)}>
              <Plus className="w-4 h-4" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {localWorkout.exercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No exercises added yet</p>
              <Button onClick={() => setShowExerciseModal(true)}>
                <Plus className="w-4 h-4" />
                Add First Exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {localWorkout.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                  index={index}
                  allExercises={exercises}
                  onRemove={() => removeExercise(index)}
                  onMoveUp={() => index > 0 && reorderExercises(index, index - 1)}
                  onMoveDown={() => index < localWorkout.exercises.length - 1 && reorderExercises(index, index + 1)}
                  onAddSet={() => addSet(index)}
                  onUpdateSet={(setIndex, updates) => updateSet(index, setIndex, updates)}
                  onToggleSet={(setIndex) => toggleSetComplete(index, setIndex)}
                  onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                  volume={getExerciseVolume(index)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Volume</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {getTotalVolume().toLocaleString()} kg
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Est. Duration</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Math.max(1, Math.round(getTotalVolume() / 500))} min
            </p>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showExerciseModal} onClose={() => setShowExerciseModal(false)} title="Add Exercise" size="xl">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchExercise}
                onChange={e => setSearchExercise(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedMuscleGroup}
              onChange={e => setSelectedMuscleGroup(e.target.value as typeof selectedMuscleGroup)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MUSCLE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="max-h-96 overflow-y-auto grid gap-3 sm:grid-cols-2">
            {filteredExercises.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => { addExercise(exercise); setShowExerciseModal(false); }}
                className="p-4 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h4 className="font-medium text-slate-900 dark:text-slate-100">{exercise.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{exercise.equipment}</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getMuscleGroupColor(exercise.muscleGroup)}20` }}>
                    {exercise.muscleGroup.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-500 dark:text-slate-400">
                No exercises found
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Workout" size="sm">
        <div className="space-y-3">
          <p className="text-slate-600 dark:text-slate-400">Save this workout to your history?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Workout</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  allExercises: Exercise[];
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddSet: () => void;
  onUpdateSet: (setIndex: number, updates: Partial<WorkoutSet>) => void;
  onToggleSet: (setIndex: number) => void;
  onRemoveSet: (setIndex: number) => void;
  volume: { volume: number; sets: number; reps: number };
}

function ExerciseCard({
  exercise,
  index,
  allExercises,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddSet,
  onUpdateSet,
  onToggleSet,
  onRemoveSet,
  volume,
}: ExerciseCardProps) {
  const exerciseDetails = allExercises.find(e => e.id === exercise.exerciseId);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-lg font-mono text-slate-400 w-8 text-center">{index + 1}</span>
          <GripVertical className="w-5 h-5 text-slate-400 cursor-grab active:cursor-grabbing" />
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100">{exerciseDetails?.name || exercise.exerciseId}</h4>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {exerciseDetails && (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{exerciseDetails.equipment}</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getMuscleGroupColor(exerciseDetails.muscleGroup)}20` }}>
                    {exerciseDetails.muscleGroup.replace('_', ' ')}
                  </span>
                </>
              )}
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{volume.volume.toLocaleString()} kg</span>
              <span className="text-slate-400">•</span>
              <span>{volume.sets} sets</span>
              <span className="text-slate-400">•</span>
              <span>{volume.reps} reps</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move up">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={onMoveDown} disabled={index === allExercises.length - 1} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move down">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" aria-label="Remove exercise">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-3 border-t border-slate-200 dark:border-slate-700">
          {exercise.sets.map((set, setIndex) => (
            <SetRow
              key={set.id}
              set={set}
              setIndex={setIndex}
              exerciseIndex={index}
              onUpdate={updates => onUpdateSet(setIndex, updates)}
              onToggle={() => onToggleSet(setIndex)}
              onRemove={() => onRemoveSet(setIndex)}
            />
          ))}
          <button
            onClick={onAddSet}
            className="w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Set
          </button>
        </div>
      )}
    </div>
  );
}

interface SetRowProps {
  set: WorkoutSet;
  setIndex: number;
  exerciseIndex: number;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onToggle: () => void;
  onRemove: () => void;
}

function SetRow({ set, onUpdate, onToggle, onRemove }: SetRowProps) {
  const [reps, setReps] = useState(set.reps.toString());
  const [weight, setWeight] = useState(set.weight.toString());
  const [rpe, setRpe] = useState(set.rpe?.toString() || '');

  const handleRepsChange = (value: string) => {
    setReps(value);
    onUpdate({ reps: parseInt(value) || 0 });
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    onUpdate({ weight: parseFloat(value) || 0 });
  };

  const handleRpeChange = (value: string) => {
    setRpe(value);
    onUpdate({ rpe: parseFloat(value) || undefined });
  };

  const oneRepMax = set.reps > 0 && set.weight > 0 ? calculateOneRepMax(set.weight, set.reps) : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          set.isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
        }`}
        aria-label={set.isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {set.isCompleted && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </button>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={e => handleRepsChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
            max="999"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={e => handleWeightChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
            max="999"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">RPE</label>
          <input
            type="number"
            step="0.5"
            value={rpe}
            onChange={e => handleRpeChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
            max="10"
            placeholder="Optional"
          />
        </div>
        <div className="flex items-end">
          <div className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-center text-sm font-mono text-indigo-600 dark:text-indigo-400">
            {oneRepMax > 0 ? `${oneRepMax}kg 1RM` : '—'}
          </div>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 flex-shrink-0"
        aria-label="Remove set"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}