import { Alert } from 'react-native';

export const MENU_ACTION_SUCCESS_MESSAGES = {
  addItem: 'Added meal to menu successfully',
  logItem: 'Logged meal successfully',
  deleteItem: 'Removed meal from menu successfully',
  updateItem: 'Updated meal in menu successfully',
} as const;

export function showMenuSuccessAlert(message: string) {
  Alert.alert('Thành công', message);
}