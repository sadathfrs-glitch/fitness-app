import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/Modal';
import { formatDate, formatDuration, calculateVolume } from '../utils/helpers';
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Play,
  Clock,
  Dumbbell,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export function Workouts() {
  const { workouts, loading, addWorkout, addTemplate } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const filteredWorkouts = workouts.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'completed' && w.completedAt) ||
      (filter === 'in_progress' && w.startedAt && !w.completedAt);
    return matchesSearch && matchesFilter;
  });

  const handleNewWorkout = async (isTemplate = false) => {
    const name = prompt(isTemplate ? 'Template name:' : 'Workout name:');
    if (!name) return;

    const baseWorkout = {
      name,
      description: '',
      exercises: [],
      isTemplate,
      userId: '', // Will be set by firestoreService
    };

    if (isTemplate) {
      await addTemplate(baseWorkout);
    } else {
      const id = await addWorkout(baseWorkout);
      navigate(`/workouts/${id}`);
    }
  };

  const handleDuplicate = async (workout: typeof workouts[0]) => {
    const newWorkout = {
      ...workout,
      name: `${workout.name} (Copy)`,
      startedAt: undefined,
      completedAt: undefined,
      duration: undefined,
      isTemplate: false,
    };
    const id = await addWorkout(newWorkout);
    navigate(`/workouts/${id}`);
  };

  const handleDelete = (id: string) => setShowDeleteConfirm(id);

  const confirmDelete = async () => {
    // TODO: Implement delete workout
    setShowDeleteConfirm(null);
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workouts</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your training sessions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleNewWorkout(true)}>
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
          <Button onClick={() => handleNewWorkout(false)}>
            <Plus className="w-4 h-4" />
            New Workout
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search workouts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              options={[
                { value: 'all', label: 'All Workouts' },
                { value: 'completed', label: 'Completed' },
                { value: 'in_progress', label: 'In Progress' },
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      ) : filteredWorkouts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkouts.map(workout => (
            <Card key={workout.id} hover className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link to={workout.startedAt && !workout.completedAt ? `/workouts/${workout.id}/active` : `/workouts/${workout.id}`}>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{workout.name}</h3>
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {workout.exercises.length} exercises
                    </span>
                    {workout.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(workout.duration * 60)}
                      </span>
                    )}
                    {workout.completedAt && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        ✓ {formatDate(workout.completedAt)}
                      </span>
                    )}
                    {workout.startedAt && !workout.completedAt && (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        In Progress
                      </span>
                    )}
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {calculateVolume(workout.exercises.flatMap(e => e.sets)).toLocaleString()} kg
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {workout.startedAt && !workout.completedAt && (
                    <Link to={`/workouts/${workout.id}/active`}>
                      <Button size="sm" variant="primary">
                        <Play className="w-4 h-4" />
                        Continue
                      </Button>
                    </Link>
                  )}
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                <Link to={`/workouts/${workout.id}`}>
                  <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                    <ChevronRight className="w-4 h-4" />
                    View
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(workout)}>
                  <Copy className="w-4 h-4" />
                  Duplicate
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(workout.id)}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {debouncedSearch ? 'No workouts found' : 'No workouts yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {debouncedSearch ? 'Try adjusting your search or filters' : 'Start tracking your training sessions'}
            </p>
            <Button onClick={() => handleNewWorkout(false)}>
              <Plus className="w-4 h-4" />
              Log First Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Delete Workout"
          message="Are you sure you want to delete this workout? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}