import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Exercise,
  Workout,
  WorkoutPlan,
  BodyMeasurement,
  PersonalRecord,
  NutritionEntry,
  UserProfile,
  FoodItem,
} from '../types';

const USERS_COLLECTION = 'users';
const EXERCISES_COLLECTION = 'exercises';
const WORKOUTS_COLLECTION = 'workouts';
const PLANS_COLLECTION = 'plans';
const MEASUREMENTS_COLLECTION = 'measurements';
const PRS_COLLECTION = 'personalRecords';
const NUTRITION_COLLECTION = 'nutrition';
const FOODS_COLLECTION = 'foods';

function userCollection(userId: string, collectionName: string) {
  return collection(db, USERS_COLLECTION, userId, collectionName);
}

function toDate(timestamp: Timestamp | Date | undefined): Date | undefined {
  if (!timestamp) return undefined;
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
}

function fromDate(date: Date | undefined): Timestamp | undefined {
  return date ? Timestamp.fromDate(date) : undefined;
}

export const firestoreService = {
  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      createdAt: toDate(data.createdAt as Timestamp) || new Date(),
      updatedAt: toDate(data.updatedAt as Timestamp) || new Date(),
    } as UserProfile;
  },

  async createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(docRef, {
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Exercises
  async getExercises(userId?: string): Promise<Exercise[]> {
    const constraints: QueryConstraint[] = [orderBy('muscleGroup'), orderBy('name')];
    if (userId) {
      constraints.unshift(where('createdBy', '==', userId));
    } else {
      constraints.unshift(where('isCustom', '==', false));
    }
    const q = query(collection(db, EXERCISES_COLLECTION), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
    } as Exercise));
  },

  async getExerciseById(id: string): Promise<Exercise | null> {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      createdAt: toDate(data.createdAt as Timestamp) || new Date(),
    } as Exercise;
  },

  async createExercise(userId: string, exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, EXERCISES_COLLECTION));
    await setDoc(docRef, {
      ...exercise,
      createdBy: userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updateExercise(id: string, updates: Partial<Exercise>): Promise<void> {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    await updateDoc(docRef, updates);
  },

  async deleteExercise(id: string): Promise<void> {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Workouts
  async getWorkouts(userId: string, limitCount = 50): Promise<Workout[]> {
    const q = query(
      userCollection(userId, WORKOUTS_COLLECTION),
      where('isTemplate', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startedAt: toDate(doc.data().startedAt as Timestamp),
      completedAt: toDate(doc.data().completedAt as Timestamp),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
      updatedAt: toDate(doc.data().updatedAt as Timestamp) || new Date(),
    } as Workout));
  },

  async getWorkoutTemplates(userId: string): Promise<Workout[]> {
    const q = query(
      userCollection(userId, WORKOUTS_COLLECTION),
      where('isTemplate', '==', true),
      orderBy('name')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
      updatedAt: toDate(doc.data().updatedAt as Timestamp) || new Date(),
    } as Workout));
  },

  async getWorkoutById(userId: string, workoutId: string): Promise<Workout | null> {
    const docRef = doc(userCollection(userId, WORKOUTS_COLLECTION), workoutId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      startedAt: toDate(data.startedAt as Timestamp),
      completedAt: toDate(data.completedAt as Timestamp),
      createdAt: toDate(data.createdAt as Timestamp) || new Date(),
      updatedAt: toDate(data.updatedAt as Timestamp) || new Date(),
    } as Workout;
  },

  async createWorkout(userId: string, workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(userCollection(userId, WORKOUTS_COLLECTION));
    await setDoc(docRef, {
      ...workout,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updateWorkout(userId: string, workoutId: string, updates: Partial<Workout>): Promise<void> {
    const docRef = doc(userCollection(userId, WORKOUTS_COLLECTION), workoutId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const docRef = doc(userCollection(userId, WORKOUTS_COLLECTION), workoutId);
    await deleteDoc(docRef);
  },

  // Workout Plans
  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    const q = query(userCollection(userId, PLANS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: toDate(doc.data().startDate as Timestamp) || new Date(),
      endDate: toDate(doc.data().endDate as Timestamp),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
      updatedAt: toDate(doc.data().updatedAt as Timestamp) || new Date(),
    } as WorkoutPlan));
  },

  async getActivePlan(userId: string): Promise<WorkoutPlan | null> {
    const q = query(
      userCollection(userId, PLANS_COLLECTION),
      where('isActive', '==', true),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: toDate(data.startDate as Timestamp) || new Date(),
      endDate: toDate(data.endDate as Timestamp),
      createdAt: toDate(data.createdAt as Timestamp) || new Date(),
      updatedAt: toDate(data.updatedAt as Timestamp) || new Date(),
    } as WorkoutPlan;
  },

  async createPlan(userId: string, plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(userCollection(userId, PLANS_COLLECTION));
    await setDoc(docRef, {
      ...plan,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updatePlan(userId: string, planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const docRef = doc(userCollection(userId, PLANS_COLLECTION), planId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deletePlan(userId: string, planId: string): Promise<void> {
    const docRef = doc(userCollection(userId, PLANS_COLLECTION), planId);
    await deleteDoc(docRef);
  },

  // Body Measurements
  async getMeasurements(userId: string): Promise<BodyMeasurement[]> {
    const q = query(userCollection(userId, MEASUREMENTS_COLLECTION), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: toDate(doc.data().date as Timestamp) || new Date(),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
    } as BodyMeasurement));
  },

  async addMeasurement(userId: string, measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(userCollection(userId, MEASUREMENTS_COLLECTION));
    await setDoc(docRef, {
      ...measurement,
      userId,
      date: fromDate(measurement.date),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updateMeasurement(userId: string, measurementId: string, updates: Partial<BodyMeasurement>): Promise<void> {
    const docRef = doc(userCollection(userId, MEASUREMENTS_COLLECTION), measurementId);
    await updateDoc(docRef, updates);
  },

  async deleteMeasurement(userId: string, measurementId: string): Promise<void> {
    const docRef = doc(userCollection(userId, MEASUREMENTS_COLLECTION), measurementId);
    await deleteDoc(docRef);
  },

  // Personal Records
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const q = query(userCollection(userId, PRS_COLLECTION), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: toDate(doc.data().date as Timestamp) || new Date(),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
    } as PersonalRecord));
  },

  async addPersonalRecord(userId: string, pr: Omit<PersonalRecord, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(userCollection(userId, PRS_COLLECTION));
    await setDoc(docRef, {
      ...pr,
      userId,
      date: fromDate(pr.date),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Nutrition
  async getNutritionEntries(userId: string, startDate?: Date, endDate?: Date): Promise<NutritionEntry[]> {
    const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
    if (startDate) constraints.unshift(where('date', '>=', Timestamp.fromDate(startDate)));
    if (endDate) constraints.unshift(where('date', '<=', Timestamp.fromDate(endDate)));
    const q = query(userCollection(userId, NUTRITION_COLLECTION), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: toDate(doc.data().date as Timestamp) || new Date(),
      createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
      updatedAt: toDate(doc.data().updatedAt as Timestamp) || new Date(),
    } as NutritionEntry));
  },

  async getNutritionEntry(userId: string, date: Date): Promise<NutritionEntry | null> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const q = query(
      userCollection(userId, NUTRITION_COLLECTION),
      where('date', '>=', Timestamp.fromDate(dayStart)),
      where('date', '<=', Timestamp.fromDate(dayEnd)),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: toDate(data.date as Timestamp) || new Date(),
      createdAt: toDate(data.createdAt as Timestamp) || new Date(),
      updatedAt: toDate(data.updatedAt as Timestamp) || new Date(),
    } as NutritionEntry;
  },

  async upsertNutritionEntry(userId: string, entry: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const existing = await this.getNutritionEntry(userId, entry.date);
    if (existing) {
      const docRef = doc(userCollection(userId, NUTRITION_COLLECTION), existing.id);
      await updateDoc(docRef, {
        ...entry,
        date: fromDate(entry.date),
        updatedAt: Timestamp.now(),
      });
      return existing.id;
    } else {
      const docRef = doc(userCollection(userId, NUTRITION_COLLECTION));
      await setDoc(docRef, {
        ...entry,
        userId,
        date: fromDate(entry.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    }
  },

  // Foods
  async getFoods(userId?: string): Promise<FoodItem[]> {
    const constraints: QueryConstraint[] = [orderBy('name')];
    if (userId) {
      constraints.unshift(where('createdBy', '==', userId));
    }
    const q = query(collection(db, FOODS_COLLECTION), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as FoodItem));
  },

  async createFood(userId: string, food: Omit<FoodItem, 'id'>): Promise<string> {
    const docRef = doc(collection(db, FOODS_COLLECTION));
    await setDoc(docRef, {
      ...food,
      createdBy: userId,
    });
    return docRef.id;
  },

  // Real-time listeners
  subscribeToWorkouts(userId: string, callback: (workouts: Workout[]) => void): Unsubscribe {
    const q = query(
      userCollection(userId, WORKOUTS_COLLECTION),
      where('isTemplate', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(q, snap => {
      const workouts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: toDate(doc.data().startedAt as Timestamp),
        completedAt: toDate(doc.data().completedAt as Timestamp),
        createdAt: toDate(doc.data().createdAt as Timestamp) || new Date(),
        updatedAt: toDate(doc.data().updatedAt as Timestamp) || new Date(),
      } as Workout));
      callback(workouts);
    });
  },

  subscribeToActivePlan(userId: string, callback: (plan: WorkoutPlan | null) => void): Unsubscribe {
    const q = query(
      userCollection(userId, PLANS_COLLECTION),
      where('isActive', '==', true),
      limit(1)
    );
    return onSnapshot(q, snap => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const doc = snap.docs[0];
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        startDate: toDate(data.startDate as Timestamp) || new Date(),
        endDate: toDate(data.endDate as Timestamp),
        createdAt: toDate(data.createdAt as Timestamp) || new Date(),
        updatedAt: toDate(data.updatedAt as Timestamp) || new Date(),
      } as WorkoutPlan);
    });
  },
};