import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDate, formatDuration, calculateVolume, getWeeklyAverage } from '../utils/helpers';
import {
  Dumbbell,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Plus,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

type ChartDataPoint = { date: Date; value: number };

export function Dashboard() {
  const { user, profile } = useAuth();
  const { workouts, measurements, personalRecords, activePlan, loading } = useApp();
  const [weeklyVolume, setWeeklyVolume] = useState<ChartDataPoint[]>([]);
  const [weightTrend, setWeightTrend] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (workouts.length > 0) {
      const volumeData = workouts.map(w => ({
        date: w.completedAt || w.createdAt,
        value: calculateVolume(w.exercises.flatMap(e => e.sets)),
      }));
      const avg = getWeeklyAverage(volumeData, 8);
      setWeeklyVolume(avg.map(d => ({ date: d.date, value: d.average })));
    }
  }, [workouts]);

  useEffect(() => {
    if (measurements.length > 0) {
      const weightData = measurements
        .filter(m => m.weight !== undefined)
        .map(m => ({ date: m.date, value: m.weight! }));
      const avg = getWeeklyAverage(weightData, 12);
      setWeightTrend(avg.map(d => ({ date: d.date, value: d.average })));
    }
  }, [measurements]);

  const recentWorkouts = workouts.slice(0, 5);
  const recentPRs = personalRecords.slice(0, 5);

  const totalWorkouts = workouts.filter(w => w.completedAt).length;
  const thisMonthWorkouts = workouts.filter(w => {
    if (!w.completedAt) return false;
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return w.completedAt >= monthAgo;
  }).length;
  const totalVolume = workouts.reduce((sum, w) => sum + calculateVolume(w.exercises.flatMap(e => e.sets)), 0);
  const currentStreak = calculateStreak(workouts);

  const stats = [
    { label: 'Total Workouts', value: totalWorkouts, icon: Dumbbell, color: 'text-indigo-600' },
    { label: 'This Month', value: thisMonthWorkouts, icon: Flame, color: 'text-orange-500' },
    { label: 'Total Volume', value: `${(totalVolume / 1000).toFixed(1)}k kg`, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Current Streak', value: `${currentStreak} days`, icon: Target, color: 'text-red-500' },
  ];

  if (loading) {
    return (
      <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back, {profile?.displayName || user?.email?.split('@')[0] || 'Athlete'}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your fitness overview</p>
        </div>
        <Link to="/workouts/new">
          <Button>
            <Plus className="w-4 h-4" />
            Start Workout
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} hover>
            <CardContent className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Volume Trend</CardTitle>
              <span className="text-sm text-slate-500 dark:text-slate-400">Last 8 weeks</span>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyVolume.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyVolume}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={date => formatDate(date, 'MMM d')}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: any, name: string | number | undefined) => value !== undefined ? [`${Number(value).toLocaleString()} kg`, String(name || 'Volume')] : ['', '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#volumeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                No workout data yet. Start tracking!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weight Trend</CardTitle>
              <span className="text-sm text-slate-500 dark:text-slate-400">Last 12 weeks</span>
            </div>
          </CardHeader>
          <CardContent>
            {weightTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={date => formatDate(date, 'MMM d')}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any, name: string | number | undefined) => value !== undefined ? [`${Number(value)} kg`, String(name || 'Weight')] : ['', '']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                No weight data yet. Add measurements!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Workouts</CardTitle>
              <Link to="/workouts" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.map(workout => (
                  <Link key={workout.id} to={`/workouts/${workout.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                          <Dumbbell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{workout.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(workout.completedAt || workout.createdAt)} •
                            {workout.duration ? ` ${formatDuration(workout.duration * 60)}` : ''}
                            {workout.exercises.length} exercises
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No workouts yet</p>
                <Link to="/workouts/new" className="mt-2 inline-block">
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                    Log First Workout
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Personal Records</CardTitle>
              <Link to="/progress" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPRs.length > 0 ? (
              <div className="space-y-3">
                {recentPRs.map(pr => (
                  <div key={pr.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{pr.exerciseName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(pr.date)} • {pr.weight}kg × {pr.reps} reps
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600 dark:text-yellow-400">
                        {pr.oneRepMax} kg 1RM
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No PRs yet</p>
                <p className="text-sm">Complete workouts to set records</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {activePlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Plan</CardTitle>
              <Link to="/plans" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                View Plan <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{activePlan.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activePlan.days.filter(d => !d.isRestDay).length} training days/week
                </p>
              </div>
              <Link to={`/plans/${activePlan.id}`}>
                <Button variant="outline" size="sm">View Today's Workout</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateStreak(workouts: { completedAt?: Date }[]): number {
  const completedDates = workouts
    .filter(w => w.completedAt)
    .map(w => new Date(w.completedAt!).toDateString())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let checkDate = completedDates[0] === today || completedDates[0] === yesterday ? 0 : -1;

  for (let i = 0; i < completedDates.length; i++) {
    const expectedDate = new Date(Date.now() - (checkDate + i) * 86400000).toDateString();
    if (completedDates[i] === expectedDate) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}