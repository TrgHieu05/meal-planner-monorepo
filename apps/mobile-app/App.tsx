import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [message, setMessage] = useState<string>('Chưa kết nối');

  const testConnection = async () => {
    try {
      // Gọi vào localhost:80 (Nginx) thay vì 3000 (Backend)
      // Lưu ý: Trên Android Emulator, localhost là 10.0.2.2
      // Trên máy thật/iOS Simulator, dùng IP LAN của máy tính (ví dụ 192.168.1.x)
      const response = await fetch('http://localhost:80/api'); 
      const text = await response.text();
      setMessage(`Kết nối thành công: ${text}`);
    } catch (error) {
      setMessage(`Lỗi kết nối: ${error}`);
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
