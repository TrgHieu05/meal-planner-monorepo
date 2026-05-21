import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getStorageItemAsync(key: string) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }

      return localStorage.getItem(key);
    } catch (error) {
      console.error('Local storage is unavailable:', error);
      return null;
    }
  }

  return SecureStore.getItemAsync(key);
}

export async function setStorageItemAsync(
  key: string,
  value: string | null,
) {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      if (value === null) {
        localStorage.removeItem(key);
        return;
      }

      localStorage.setItem(key, value);
      return;
    } catch (error) {
      console.error('Local storage is unavailable:', error);
      return;
    }
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}