import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { formatDate, calculateMacroTargets } from '../utils/helpers';
import {
  Plus,
  Utensils,
  Droplets,
  Flame,
  WheatOff,
  Egg,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import type { Meal, FoodItem, MealType, MacroTargets } from '../types';

const MEAL_TYPES: { value: MealType; label: string; icon: React.ReactNode }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <Sun className="w-4 h-4" /> },
  { value: 'lunch', label: 'Lunch', icon: <Utensils className="w-4 h-4" /> },
  { value: 'dinner', label: 'Dinner', icon: <Moon className="w-4 h-4" /> },
  { value: 'snack', label: 'Snack', icon: <WheatOff className="w-4 h-4" /> },
  { value: 'pre_workout', label: 'Pre-Workout', icon: <Flame className="w-4 h-4" /> },
  { value: 'post_workout', label: 'Post-Workout', icon: <Egg className="w-4 h-4" /> },
];

const MACRO_LABELS = [
  { key: 'calories' as keyof MacroTargets, label: 'Calories', unit: 'kcal', color: 'text-orange-500', icon: Flame },
  { key: 'protein' as keyof MacroTargets, label: 'Protein', unit: 'g', color: 'text-red-500', icon: Egg },
  { key: 'carbs' as keyof MacroTargets, label: 'Carbs', unit: 'g', color: 'text-blue-500', icon: WheatOff },
  { key: 'fat' as keyof MacroTargets, label: 'Fat', unit: 'g', color: 'text-yellow-500', icon: Droplets },
];

export function Nutrition() {
  const { nutritionEntries, foods, upsertNutrition, addFood } = useApp();
  const { profile, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState<{ mealType?: MealType; meal?: Meal } | null>(null);
  const [foodForm, setFoodForm] = useState<Partial<FoodItem>>({
    name: '',
    amount: 100,
    unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    isCustom: true,
  });
  const [searchFood, setSearchFood] = useState('');
  const debouncedSearch = useDebounce(searchFood, 300);

  const todayEntry = nutritionEntries.find(e => formatDate(e.date, 'yyyy-MM-dd') === formatDate(selectedDate, 'yyyy-MM-dd'));
  const targets = profile?.macroTargets || calculateMacroTargets(2000, 'maintain');

  const totals = todayEntry?.meals.reduce(
    (acc, meal) => {
      meal.foods.forEach(food => {
        const multiplier = food.amount / 100;
        acc.calories += food.calories * multiplier;
        acc.protein += food.protein * multiplier;
        acc.carbs += food.carbs * multiplier;
        acc.fat += food.fat * multiplier;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleDateChange = (direction: number) => {
    setSelectedDate(prev => new Date(prev.getTime() + direction * 86400000));
  };

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFood(foodForm as Omit<FoodItem, 'id'>);
    setShowFoodModal(false);
    setFoodForm({ name: '', amount: 100, unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, isCustom: true });
  };

  const handleAddFoodToMeal = async (mealType: MealType, food: FoodItem, amount: number) => {
    const newFood = { ...food, amount };
    const meals = todayEntry?.meals.map(m => {
      if (m.type === mealType) {
        return { ...m, foods: [...m.foods, newFood] };
      }
      return m;
    }) || [{ id: crypto.randomUUID(), name: mealType, type: mealType, foods: [newFood], calories: 0, protein: 0, carbs: 0, fat: 0, time: new Date() }];

    const entryMeals = meals.map(m => ({
      ...m,
      calories: m.foods.reduce((sum, f) => sum + (f.calories * f.amount / 100), 0),
      protein: m.foods.reduce((sum, f) => sum + (f.protein * f.amount / 100), 0),
      carbs: m.foods.reduce((sum, f) => sum + (f.carbs * f.amount / 100), 0),
      fat: m.foods.reduce((sum, f) => sum + (f.fat * f.amount / 100), 0),
    }));

    await upsertNutrition({
      userId: user?.uid || '',
      date: selectedDate,
      meals: entryMeals,
      totalCalories: entryMeals.reduce((s, m) => s + m.calories, 0),
      totalProtein: entryMeals.reduce((s, m) => s + m.protein, 0),
      totalCarbs: entryMeals.reduce((s, m) => s + m.carbs, 0),
      totalFat: entryMeals.reduce((s, m) => s + m.fat, 0),
    });
  };

  const handleRemoveFood = async (mealType: MealType, foodId: string) => {
    const meals = todayEntry?.meals.map(m => {
      if (m.type === mealType) {
        return { ...m, foods: m.foods.filter(f => f.id !== foodId) };
      }
      return m;
    }) || [];

    const entryMeals = meals.map(m => ({
      ...m,
      calories: m.foods.reduce((sum, f) => sum + (f.calories * f.amount / 100), 0),
      protein: m.foods.reduce((sum, f) => sum + (f.protein * f.amount / 100), 0),
      carbs: m.foods.reduce((sum, f) => sum + (f.carbs * f.amount / 100), 0),
      fat: m.foods.reduce((sum, f) => sum + (f.fat * f.amount / 100), 0),
    }));

    await upsertNutrition({
      userId: user?.uid || '',
      date: selectedDate,
      meals: entryMeals,
      totalCalories: entryMeals.reduce((s, m) => s + m.calories, 0),
      totalProtein: entryMeals.reduce((s, m) => s + m.protein, 0),
      totalCarbs: entryMeals.reduce((s, m) => s + m.carbs, 0),
      totalFat: entryMeals.reduce((s, m) => s + m.fat, 0),
    });
  };

  const filteredFoods = foods.filter(f =>
    f.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => handleDateChange(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedDate, 'MMM d, yyyy')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <button onClick={() => handleDateChange(1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowFoodModal(true); }}>
            <Plus className="w-4 h-4" />
            Add Food
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MACRO_LABELS.map(({ key, label, unit, color, icon: Icon }) => (
          <Card key={key} hover>
            <CardContent className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {Math.round(totals[key])}/{targets[key]}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label} ({unit})</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {MEAL_TYPES.map(mealType => {
            const meal = todayEntry?.meals.find(m => m.type === mealType.value);
            const mealFoods = meal?.foods || [];
            const mealCalories = mealFoods.reduce((sum, f) => sum + (f.calories * f.amount / 100), 0);

            return (
              <Card key={mealType.value}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {mealType.icon}
                      </div>
                      <CardTitle className="capitalize">{mealType.label}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                        {Math.round(mealCalories)} kcal
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setShowMealModal({ mealType: mealType.value })}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {mealFoods.length > 0 ? (
                    <div className="space-y-2">
                      {mealFoods.map(food => (
                        <div key={food.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{food.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {food.amount}{food.unit} • P: {Math.round(food.protein * food.amount / 100)}g
                                C: {Math.round(food.carbs * food.amount / 100)}g F: {Math.round(food.fat * food.amount / 100)}g
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                              {Math.round(food.calories * food.amount / 100)} kcal
                            </span>
                            <button
                              onClick={() => handleRemoveFood(mealType.value, food.id)}
                              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              aria-label="Remove food"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      <p>No foods logged</p>
                      <Button size="sm" className="mt-2" variant="outline" onClick={() => setShowMealModal({ mealType: mealType.value })}>
                        <Plus className="w-4 h-4" />
                        Add Food
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Add</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={searchFood}
                  onChange={e => setSearchFood(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredFoods.slice(0, 10).map(food => (
                  <button
                    key={food.id}
                    onClick={() => {
                      const mealType = MEAL_TYPES[0].value;
                      handleAddFoodToMeal(mealType, food, 100);
                    }}
                    className="w-full p-3 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <p className="font-medium text-slate-900 dark:text-slate-100">{food.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Per 100g: {food.calories}kcal • P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                    </p>
                  </button>
                ))}
                {filteredFoods.length === 0 && foods.length > 0 && (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">No matching foods</div>
                )}
                {foods.length === 0 && (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    <p>No custom foods yet</p>
                    <Button size="sm" className="mt-2" variant="outline" onClick={() => setShowFoodModal(true)}>
                      Add First Food
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Water Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      strokeDasharray={352}
                      strokeDashoffset={352 * (1 - (todayEntry?.waterIntake || 0) / 3000)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {(todayEntry?.waterIntake || 0) / 1000}L
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Goal: 3L daily</p>
                <div className="flex gap-2 mt-4 justify-center">
                  {[250, 500].map(ml => (
                    <Button key={ml} size="sm" variant="outline" onClick={() => { /* TODO: Add water */ }}>
                      +{ml}ml
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={showFoodModal} onClose={() => setShowFoodModal(false)} title="Add Custom Food" size="md">
        <form onSubmit={handleFoodSubmit} className="space-y-4">
          <Input
            label="Food Name"
            value={foodForm.name}
            onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
            required
            placeholder="e.g., Chicken Breast"
          />
          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              label="Amount"
              type="number"
              value={foodForm.amount}
              onChange={e => setFoodForm({ ...foodForm, amount: parseFloat(e.target.value) })}
            />
            <Select label="Unit" value={foodForm.unit || 'g'} onChange={e => setFoodForm({ ...foodForm, unit: e.target.value })} options={[{ value: 'g', label: 'Grams' }, { value: 'ml', label: 'Milliliters' }, { value: 'oz', label: 'Ounces' }, { value: 'serving', label: 'Serving' }]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              label="Calories"
              type="number"
              step="1"
              value={foodForm.calories}
              onChange={e => setFoodForm({ ...foodForm, calories: parseFloat(e.target.value) })}
            />
            <Input
              label="Protein (g)"
              type="number"
              step="0.1"
              value={foodForm.protein}
              onChange={e => setFoodForm({ ...foodForm, protein: parseFloat(e.target.value) })}
            />
            <Input
              label="Carbs (g)"
              type="number"
              step="0.1"
              value={foodForm.carbs}
              onChange={e => setFoodForm({ ...foodForm, carbs: parseFloat(e.target.value) })}
            />
            <Input
              label="Fat (g)"
              type="number"
              step="0.1"
              value={foodForm.fat}
              onChange={e => setFoodForm({ ...foodForm, fat: parseFloat(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowFoodModal(false)}>Cancel</Button>
            <Button type="submit">Add Food</Button>
          </div>
        </form>
      </Modal>

      {showMealModal && (
        <Modal isOpen={true} onClose={() => setShowMealModal(null)} title="Add Food to Meal" size="lg">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchFood}
                onChange={e => setSearchFood(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="max-h-96 overflow-y-auto grid gap-3">
              {filteredFoods.map(food => (
                <button
                  key={food.id}
                  onClick={() => {
                    const amount = prompt(`Amount in ${food.unit}:`, '100');
                    if (amount) {
                      handleAddFoodToMeal(showMealModal.mealType!, food, parseFloat(amount));
                      setShowMealModal(null);
                    }
                  }}
                  className="p-4 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">{food.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Per 100{food.unit}: {food.calories}kcal • P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                  </p>
                </button>
              ))}
              {filteredFoods.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
                  No foods found. <Button className="ml-2" size="sm" onClick={() => { setShowMealModal(null); setShowFoodModal(true); }}>Add Custom Food</Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}