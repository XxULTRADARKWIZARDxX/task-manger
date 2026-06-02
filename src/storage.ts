import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_STATE_VERSION } from './data';
import type { HabitGridState } from './types';

const STORAGE_KEY = 'habit-grid-state-v1';

export async function loadHabitGridState(): Promise<HabitGridState | null> {
  const rawState = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawState) {
    return null;
  }

  const parsedState = JSON.parse(rawState) as Partial<HabitGridState>;
  if (parsedState.schemaVersion !== APP_STATE_VERSION) {
    return null;
  }

  return parsedState as HabitGridState;
}

export async function saveHabitGridState(state: HabitGridState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
