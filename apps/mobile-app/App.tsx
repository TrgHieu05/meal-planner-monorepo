import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';

export default function App() {
  // Hàm này sẽ tự động chọn URL phù hợp dựa trên môi trường (Dev/Prod) và thiết bị (Emulator/Real Device)
  const getApiUrl = () => {
    if (__DEV__) {
      // Lấy địa chỉ IP của máy tính đang chạy Metro Bundler
      // Ví dụ: 192.168.1.5:8081 -> hostUri = "192.168.1.5:8081"
      const debuggerHost = Constants.expoConfig?.hostUri;
      const localhost = debuggerHost?.split(':')[0];

      if (!localhost) {
        // Fallback nếu không lấy được IP tự động
        return 'http://192.168.1.195:80/api'; 
      }

      if (Platform.OS === 'android') {
         // Trên Android Emulator, localhost của máy tính là 10.0.2.2
         // Nhưng nếu dùng IP LAN (192.168.x.x) thì Emulator VẪN HIỂU ĐƯỢC
         // Vì vậy, cách tốt nhất là luôn dùng IP LAN mà Expo tự tìm thấy
         return `http://${localhost}:80/api`;
      }
      
      // Mặc định cho iOS và Web
      return `http://${localhost}:80/api`;
    } else {
      // Môi trường Production
      return 'https://api.meal-planner.com/api'; 
    }
  };

  const API_URL = getApiUrl(); 

  const [message, setMessage] = useState<string>('Chưa kết nối');

  const testConnection = async () => {
    try {
      setMessage('Đang kết nối...');
      const response = await fetch(API_URL); 
      const text = await response.text();
      setMessage(`Kết nối thành công: ${text}`);
    } catch (error) {
      setMessage(`Lỗi kết nối đến ${API_URL}: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Trạng thái: {message}</Text>
      <Button title="Kiểm tra kết nối Backend (qua Nginx)" onPress={testConnection} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
