import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Platform,
  TextInput,
  FlatList,
} from 'react-native';
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
  const [token, setToken] = useState<string>('');
  const [query, setQuery] = useState<string>('egg tomato');
  const [allergies, setAllergies] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [cookingTime, setCookingTime] = useState<string>('');
  const [results, setResults] = useState<
    Array<{
      id: number;
      name: string;
      score: number;
      difficulty: 'easy' | 'medium' | 'hard';
      cook_time_min: number;
    }>
  >([]);

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

  const searchMeals = async () => {
    try {
      setMessage('Đang tìm kiếm...');
      const params = new URLSearchParams();
      params.set('q', query);
      if (allergies) params.set('allergies', allergies);
      if (difficulty) params.set('difficulty', difficulty);
      if (cookingTime) params.set('cookingTime', cookingTime);
      const response = await fetch(`${API_URL}/v1/meals?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) {
        const text = await response.text();
        setMessage(`Lỗi ${response.status}: ${text}`);
        setResults([]);
        return;
      }
      const json = await response.json();
      setResults(json.list ?? []);
      setMessage(`Tìm thấy ${json.list?.length ?? 0} món`);
    } catch (error) {
      setMessage(`Lỗi tìm kiếm: ${error}`);
      setResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Meal Search</Text>
      <Text style={styles.label}>JWT Token</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập JWT token"
        value={token}
        onChangeText={setToken}
      />
      <Text style={styles.label}>Từ khóa (tên món hoặc nguyên liệu)</Text>
      <TextInput
        style={styles.input}
        placeholder="egg tomato"
        value={query}
        onChangeText={setQuery}
      />
      <Text style={styles.label}>Allergies / Excluded ingredients</Text>
      <TextInput
        style={styles.input}
        placeholder="peanut,shellfish"
        value={allergies}
        onChangeText={setAllergies}
      />
      <Text style={styles.label}>Difficulty (easy | medium | hard)</Text>
      <TextInput
        style={styles.input}
        placeholder="easy"
        value={difficulty}
        onChangeText={setDifficulty}
      />
      <Text style={styles.label}>Cooking Time (&lt;30m | &lt;45m | &lt;1hour)</Text>
      <TextInput
        style={styles.input}
        placeholder="<30m"
        value={cookingTime}
        onChangeText={setCookingTime}
      />
      <View style={styles.row}>
        <Button title="Kiểm tra Backend" onPress={testConnection} />
        <View style={{ width: 12 }} />
        <Button title="Tìm kiếm" onPress={searchMeals} />
      </View>
      <Text style={styles.status}>Trạng thái: {message}</Text>
      <FlatList
        style={{ alignSelf: 'stretch', marginTop: 12 }}
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text>Score: {item.score}</Text>
            <Text>Difficulty: {item.difficulty}</Text>
            <Text>Time: {item.cook_time_min} mins</Text>
          </View>
        )}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  status: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
});
