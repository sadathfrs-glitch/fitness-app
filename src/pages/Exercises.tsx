import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { getMuscleGroupColor, getMuscleGroupLabel, getEquipmentIcon } from '../utils/helpers';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Dumbbell,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import type { Exercise, MuscleGroup, Equipment, Difficulty } from '../types';

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'full_body', label: 'Full Body' },
];

const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bands', label: 'Bands' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function Exercises() {
  const { exercises, loading, addExercise } = useApp();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    name: '',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    instructions: [],
    tips: [],
    isCustom: true,
  });
  const debouncedSearch = useDebounce(search, 300);

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesMuscle = muscleFilter === 'all' || e.muscleGroup === muscleFilter;
    const matchesEquipment = equipmentFilter === 'all' || e.equipment === equipmentFilter;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) acc[exercise.muscleGroup] = [];
    acc[exercise.muscleGroup].push(exercise);
    return acc;
  }, {} as Record<MuscleGroup, Exercise[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const data = {
      name: formData.name,
      muscleGroup: formData.muscleGroup!,
      equipment: formData.equipment!,
      difficulty: formData.difficulty!,
      instructions: formData.instructions || [],
      tips: formData.tips || [],
      isCustom: true,
    };

    if (editingExercise) {
      // TODO: Update exercise
    } else {
      await addExercise(data);
    }
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      instructions: exercise.instructions,
      tips: exercise.tips,
      isCustom: exercise.isCustom,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => setShowDeleteConfirm(id);

  const resetForm = () => {
    setEditingExercise(null);
    setFormData({
      name: '',
      muscleGroup: 'chest',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [],
      tips: [],
      isCustom: true,
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Exercise Library</h1>
          <p className="text-slate-500 dark:text-slate-400">Browse and manage your exercise database</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4" />
          Add Exercise
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Select
              value={muscleFilter}
              onChange={e => setMuscleFilter(e.target.value as typeof muscleFilter)}
              options={[{ value: 'all', label: 'All Muscles' }, ...MUSCLE_GROUPS]}
              className="w-full sm:w-40"
            />
            <Select
              value={equipmentFilter}
              onChange={e => setEquipmentFilter(e.target.value as typeof equipmentFilter)}
              options={[{ value: 'all', label: 'All Equipment' }, ...EQUIPMENT]}
              className="w-full sm:w-40"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
            </Card>
          ))}
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
            <Card key={muscleGroup}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getMuscleGroupColor(muscleGroup as MuscleGroup) }}
                    />
                    <CardTitle className="capitalize">{getMuscleGroupLabel(muscleGroup as MuscleGroup)}</CardTitle>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{exercises.length} exercises</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {exercises.map(exercise => (
                    <Link key={exercise.id} to={`/exercises/${exercise.id}`} className="block">
                      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{exercise.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                {getEquipmentIcon(exercise.equipment)} {exercise.equipment}
                              </span>
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getMuscleGroupColor(exercise.muscleGroup)}20` }}>
                                {exercise.difficulty}
                              </span>
                              {exercise.isCustom && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                  Custom
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); handleEdit(exercise); }}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            aria-label="Edit exercise"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {exercise.isCustom && (
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(exercise.id); }}
                              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-red-500"
                              aria-label="Delete exercise"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {debouncedSearch || muscleFilter !== 'all' || equipmentFilter !== 'all' ? 'No exercises found' : 'Exercise library is empty'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {debouncedSearch || muscleFilter !== 'all' || equipmentFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first exercise to get started'}
            </p>
            <Button onClick={openModal}>
              <Plus className="w-4 h-4" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingExercise ? 'Edit Exercise' : 'Add Exercise'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Exercise Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Bench Press"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Muscle Group"
              value={formData.muscleGroup!}
              onChange={e => setFormData({ ...formData, muscleGroup: e.target.value as MuscleGroup })}
              options={MUSCLE_GROUPS}
            />
            <Select
              label="Equipment"
              value={formData.equipment!}
              onChange={e => setFormData({ ...formData, equipment: e.target.value as Equipment })}
              options={EQUIPMENT}
            />
            <Select
              label="Difficulty"
              value={formData.difficulty!}
              onChange={e => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
              options={DIFFICULTIES}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Instructions (one per line)</label>
            <textarea
              value={formData.instructions?.join('\n') || ''}
              onChange={e => setFormData({ ...formData, instructions: e.target.value.split('\n').filter(l => l.trim()) })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
              rows={4}
              placeholder="1. Lie on bench with feet flat on floor
2. Grip bar slightly wider than shoulders
3. Lower bar to chest with control
4. Press back up explosively"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tips (one per line)</label>
            <textarea
              value={formData.tips?.join('\n') || ''}
              onChange={e => setFormData({ ...formData, tips: e.target.value.split('\n').filter(l => l.trim()) })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y"
              rows={3}
              placeholder="Keep wrists straight throughout the movement
Don't bounce the bar off your chest"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingExercise ? 'Save Changes' : 'Add Exercise'}
            </Button>
          </div>
        </form>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => { /* TODO: Delete exercise */ setShowDeleteConfirm(null); }}
          title="Delete Exercise"
          message="Are you sure you want to delete this exercise? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}