import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { formatDate } from '../utils/helpers';
import {
  Plus,
  Calendar,
  Trash2,
  Edit,
  Star,
} from 'lucide-react';
import type { PlanDay } from '../types';

const DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const initialDays: PlanDay[] = DAYS.map(d => ({
  id: crypto.randomUUID(),
  dayOfWeek: d.value,
  workoutId: '',
  isRestDay: true,
  notes: '',
}));

export function Plans() {
  const { plans, activePlan, templates, loading, addPlan } = useApp();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<typeof plans[0] | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: initialDays,
    isActive: false,
    startDate: new Date(),
    endDate: undefined as Date | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !user) return;

    const planData = {
      name: formData.name,
      description: formData.description,
      days: formData.days,
      isActive: formData.isActive,
      startDate: formData.startDate,
      endDate: formData.endDate,
      userId: user.uid,
    };

    if (editingPlan) {
      // TODO: Update plan
    } else {
      await addPlan(planData);
    }
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (plan: typeof plans[0]) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      days: plan.days.map(d => ({ ...d })),
      isActive: plan.isActive,
      startDate: plan.startDate,
      endDate: plan.endDate,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => setShowDeleteConfirm(id);

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      days: DAYS.map(d => ({ id: crypto.randomUUID(), dayOfWeek: d.value, workoutId: '', isRestDay: true, notes: '' })),
      isActive: false,
      startDate: new Date(),
      endDate: undefined,
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getDayWorkout = (day: typeof formData.days[0]) => {
    if (day.isRestDay || !day.workoutId) return null;
    return templates.find(t => t.id === day.workoutId);
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workout Plans</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and manage your training schedules</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      {activePlan && (
        <Card className="border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-indigo-700 dark:text-indigo-300">Active Plan</CardTitle>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">{activePlan.name}</p>
                </div>
              </div>
              <Link to={`/plans/${activePlan.id}`}>
                <Button size="sm" variant="primary">View Today</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map(day => {
                const planDay = activePlan.days.find(d => d.dayOfWeek === day.value);
                const workout = planDay ? getDayWorkout(planDay) : null;
                const isToday = new Date().getDay() === day.value;

                return (
                  <div
                    key={day.value}
                    className={`p-3 rounded-lg text-center text-sm ${
                      isToday ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <p className="font-medium text-slate-600 dark:text-slate-400">{day.short}</p>
                    {workout ? (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate mt-1">{workout.name}</p>
                    ) : planDay?.isRestDay ? (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Rest</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-48" />
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.id} hover className={plan.isActive ? 'ring-2 ring-indigo-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.isActive && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          Active
                        </span>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {DAYS.map(day => {
                    const planDay = plan.days.find(d => d.dayOfWeek === day.value);
                    const workout = planDay ? templates.find(t => t.id === planDay?.workoutId) : null;

                    return (
                      <div
                        key={day.value}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <span className="text-slate-600 dark:text-slate-400 w-20">{day.short}</span>
                        <span className="flex-1 text-slate-900 dark:text-slate-100 truncate pr-2">
                          {workout?.name || (planDay?.isRestDay ? 'Rest Day' : 'Not scheduled')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Link to={`/plans/${plan.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No workout plans yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Create a plan to structure your training week</p>
            <Button onClick={openModal}>
              <Plus className="w-4 h-4" />
              Create First Plan
            </Button>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingPlan ? 'Edit Plan' : 'Create Plan'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input label="Plan Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., Push/Pull/Legs" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y"
              rows={3}
              placeholder="Optional description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Weekly Schedule</label>
            <div className="space-y-2">
              {formData.days.map((day, index) => {
                getDayWorkout(day);
                return (
                  <div key={day.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="w-20 font-medium text-slate-700 dark:text-slate-300">{DAYS[day.dayOfWeek].label}</span>
                    <label className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={day.isRestDay}
                        onChange={e => {
                          const newDays = [...formData.days];
                          newDays[index] = { ...newDays[index], isRestDay: e.target.checked, workoutId: e.target.checked ? '' : newDays[index].workoutId };
                          setFormData({ ...formData, days: newDays });
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Rest Day</span>
                    </label>
                    {!day.isRestDay && (
                      <select
                        value={day.workoutId}
                        onChange={e => {
                          const newDays = [...formData.days];
                          newDays[index] = { ...newDays[index], workoutId: e.target.value };
                          setFormData({ ...formData, days: newDays });
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select workout template</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                    {day.isRestDay && (
                      <div className="flex-1 text-slate-400 text-center py-2">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Start Date"
              type="date"
              value={formatDate(formData.startDate, 'yyyy-MM-dd')}
              onChange={e => setFormData({ ...formData, startDate: new Date(e.target.value) })}
            />
            <Input
              label="End Date (optional)"
              type="date"
              value={formData.endDate ? formatDate(formData.endDate, 'yyyy-MM-dd') : ''}
              onChange={e => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value) : undefined })}
            />
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Set as active plan</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button type="submit">{editingPlan ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => { /* TODO: Delete plan */ setShowDeleteConfirm(null); }}
          title="Delete Plan"
          message="Are you sure you want to delete this plan? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}