import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { formatDate, calculateOneRepMax, getWeeklyAverage, formatWeight } from '../utils/helpers';
import {
  Target,
  Trophy,
  Plus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';
import type { BodyMeasurement, PersonalRecord } from '../types';

export function Progress() {
  const { measurements, personalRecords, loading, addMeasurement, addPersonalRecord } = useApp();
  const [activeTab, setActiveTab] = useState<'measurements' | 'prs' | 'charts'>('measurements');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [measurementForm, setMeasurementForm] = useState<Partial<BodyMeasurement>>({
    date: new Date(),
    weight: undefined,
    bodyFat: undefined,
    chest: undefined,
    waist: undefined,
    hips: undefined,
  });
  const [prForm, setPRForm] = useState<Partial<PersonalRecord>>({
    exerciseId: '',
    exerciseName: '',
    weight: 0,
    reps: 0,
    date: new Date(),
  });

  const weightData = measurements
    .filter(m => m.weight !== undefined)
    .map(m => ({ date: m.date, value: m.weight! }));
  const bodyFatData = measurements
    .filter(m => m.bodyFat !== undefined)
    .map(m => ({ date: m.date, value: m.bodyFat! }));

  const weeklyWeight = getWeeklyAverage(weightData, 12);
  const weeklyBodyFat = getWeeklyAverage(bodyFatData, 12);

  const measurementFields = [
    { key: 'weight' as keyof BodyMeasurement, label: 'Weight (kg)', step: 0.1 },
    { key: 'bodyFat' as keyof BodyMeasurement, label: 'Body Fat (%)', step: 0.1 },
    { key: 'chest' as keyof BodyMeasurement, label: 'Chest (cm)', step: 0.5 },
    { key: 'waist' as keyof BodyMeasurement, label: 'Waist (cm)', step: 0.5 },
    { key: 'hips' as keyof BodyMeasurement, label: 'Hips (cm)', step: 0.5 },
    { key: 'bicepLeft' as keyof BodyMeasurement, label: 'Left Bicep (cm)', step: 0.5 },
    { key: 'bicepRight' as keyof BodyMeasurement, label: 'Right Bicep (cm)', step: 0.5 },
    { key: 'thighLeft' as keyof BodyMeasurement, label: 'Left Thigh (cm)', step: 0.5 },
    { key: 'thighRight' as keyof BodyMeasurement, label: 'Right Thigh (cm)', step: 0.5 },
    { key: 'calfLeft' as keyof BodyMeasurement, label: 'Left Calf (cm)', step: 0.5 },
    { key: 'calfRight' as keyof BodyMeasurement, label: 'Right Calf (cm)', step: 0.5 },
    { key: 'neck' as keyof BodyMeasurement, label: 'Neck (cm)', step: 0.5 },
  ];

  const handleMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMeasurement({
      ...measurementForm,
      date: measurementForm.date || new Date(),
    } as BodyMeasurement);
    setShowMeasurementModal(false);
  };

  const handlePRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oneRepMax = calculateOneRepMax(prForm.weight || 0, prForm.reps || 0);
    await addPersonalRecord({
      ...prForm,
      weight: prForm.weight || 0,
      reps: prForm.reps || 0,
      oneRepMax,
      date: prForm.date || new Date(),
    } as PersonalRecord);
    setShowPRModal(false);
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Progress Tracking</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor your body measurements and personal records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMeasurementModal(true)}>
            <Plus className="w-4 h-4" />
            Add Measurement
          </Button>
          <Button onClick={() => setShowPRModal(true)}>
            <Plus className="w-4 h-4" />
            Log PR
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['measurements', 'prs', 'charts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'measurements' && 'Measurements'}
            {tab === 'prs' && 'Personal Records'}
            {tab === 'charts' && 'Charts'}
          </button>
        ))}
      </div>

      {activeTab === 'measurements' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Body Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                  ))}
                </div>
              ) : measurements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Weight</th>
                        <th className="pb-3 font-medium">Body Fat</th>
                        <th className="pb-3 font-medium">Chest</th>
                        <th className="pb-3 font-medium">Waist</th>
                        <th className="pb-3 font-medium">Hips</th>
                        <th className="pb-3 font-medium">Arms</th>
                        <th className="pb-3 font-medium">Thighs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.slice(0, 20).map(m => (
                        <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{formatDate(m.date)}</td>
                          <td className="py-3">{m.weight ? formatWeight(m.weight) : '—'}</td>
                          <td className="py-3">{m.bodyFat ? `${m.bodyFat}%` : '—'}</td>
                          <td className="py-3">{m.chest ? `${m.chest}cm` : '—'}</td>
                          <td className="py-3">{m.waist ? `${m.waist}cm` : '—'}</td>
                          <td className="py-3">{m.hips ? `${m.hips}cm` : '—'}</td>
                          <td className="py-3">
                            {m.bicepLeft && m.bicepRight ? `${m.bicepLeft}/${m.bicepRight}cm` : '—'}
                          </td>
                          <td className="py-3">
                            {m.thighLeft && m.thighRight ? `${m.thighLeft}/${m.thighRight}cm` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">No measurements recorded yet</p>
                  <Button className="mt-4" onClick={() => setShowMeasurementModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add First Measurement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Circumference Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {measurementFields.slice(2).map(field => {
                  const latest = measurements.find(m => m[field.key] !== undefined);
                  const previous = measurements.slice(1).find(m => m[field.key] !== undefined);
                  const diff = latest && previous ? (latest[field.key] as number) - (previous[field.key] as number) : 0;
                  return (
                    <div key={field.key} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{field.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {latest ? `${(latest[field.key] as number).toFixed(1)}${field.key.includes('bodyFat') ? '%' : field.key.includes('Weight') ? 'kg' : 'cm'}` : '—'}
                      </p>
                      {diff !== 0 && (
                        <p className={`text-sm mt-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}{field.key.includes('bodyFat') ? '%' : field.key.includes('Weight') ? 'kg' : 'cm'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'prs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                  ))}
                </div>
              ) : personalRecords.length > 0 ? (
                <div className="space-y-3">
                  {personalRecords.map(pr => (
                    <div key={pr.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                          <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{pr.exerciseName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(pr.date)} • {pr.weight}kg × {pr.reps} reps
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pr.oneRepMax} kg</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Est. 1RM</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">No personal records yet</p>
                  <Button className="mt-4" onClick={() => setShowPRModal(true)}>
                    <Plus className="w-4 h-4" />
                    Log First PR
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Weight & Body Fat Trend</CardTitle>
                <Select
                  value={chartPeriod}
                  onChange={e => setChartPeriod(e.target.value as typeof chartPeriod)}
                  options={[
                    { value: 'week', label: '1 Week' },
                    { value: 'month', label: '1 Month' },
                    { value: 'quarter', label: '3 Months' },
                    { value: 'year', label: '1 Year' },
                  ]}
                  className="w-36"
                />
              </div>
            </CardHeader>
            <CardContent>
              {(weeklyWeight.length > 0 || weeklyBodyFat.length > 0) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyWeight}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={date => formatDate(date, 'MMM d')}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#94a3b8"
                        fontSize={12}
                        label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', offset: 10 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#94a3b8"
                        fontSize={12}
                        label={{ value: 'Body Fat (%)', angle: 90, position: 'insideRight', offset: 10 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="Weight (kg)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="value"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                        name="Body Fat (%)"
                        data={weeklyBodyFat}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  No measurement data for charts
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>PR Progression</CardTitle>
              </CardHeader>
              <CardContent>
                {personalRecords.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          dataKey="reps"
                          name="Reps"
                          stroke="#94a3b8"
                          fontSize={12}
                        />
                        <YAxis
                          dataKey="weight"
                          name="Weight (kg)"
                          stroke="#94a3b8"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                          formatter={(value: any, name: string | number | undefined) => value !== undefined ? [
                            name === 'weight' ? `${Number(value)} kg` : `${Number(value)} reps`,
                            name === 'weight' ? 'Weight' : 'Reps',
                          ] : ['', '']}
                        />
                        <Scatter
                          name="PRs"
                          data={personalRecords.map(pr => ({
                            reps: pr.reps,
                            weight: pr.weight,
                            name: pr.exerciseName,
                            date: formatDate(pr.date),
                            oneRepMax: pr.oneRepMax,
                          }))}
                          fill="#6366f1"
                          shape="circle"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    No PR data for charts
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Measurement Changes</CardTitle>
              </CardHeader>
              <CardContent>
                {measurements.length > 1 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={measurementFields.slice(2).map(field => {
                          const latest = measurements.find(m => m[field.key] !== undefined);
                          const previous = measurements.slice(1).find(m => m[field.key] !== undefined);
                          return {
                            name: field.label.replace(' (cm)', '').replace(' (kg)', ''),
                            change: latest && previous ? (latest[field.key] as number) - (previous[field.key] as number) : 0,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="change" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    Need at least 2 measurements
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Modal isOpen={showMeasurementModal} onClose={() => setShowMeasurementModal(false)} title="Add Measurement" size="lg">
        <form onSubmit={handleMeasurementSubmit} className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={formatDate(measurementForm.date || new Date(), 'yyyy-MM-dd')}
            onChange={e => setMeasurementForm({ ...measurementForm, date: new Date(e.target.value) })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {measurementFields.map(field => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                step={field.step}
                value={measurementForm[field.key]?.toString() || ''}
                onChange={e => setMeasurementForm({ ...measurementForm, [field.key]: parseFloat(e.target.value) || undefined })}
                placeholder="Optional"
              />
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowMeasurementModal(false)}>Cancel</Button>
            <Button type="submit">Save Measurement</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPRModal} onClose={() => setShowPRModal(false)} title="Log Personal Record" size="md">
        <form onSubmit={handlePRSubmit} className="space-y-4">
          <Input
            label="Exercise Name"
            value={prForm.exerciseName}
            onChange={e => setPRForm({ ...prForm, exerciseName: e.target.value })}
            required
            placeholder="e.g., Bench Press"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.5"
              value={prForm.weight}
              onChange={e => setPRForm({ ...prForm, weight: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Reps"
              type="number"
              value={prForm.reps}
              onChange={e => setPRForm({ ...prForm, reps: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={formatDate(prForm.date || new Date(), 'yyyy-MM-dd')}
              onChange={e => setPRForm({ ...prForm, date: new Date(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowPRModal(false)}>Cancel</Button>
            <Button type="submit">Save PR</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}