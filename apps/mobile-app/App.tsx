import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#34eb80" />
      <View style={styles.upperContainer}></View>
      <View style={styles.container}>
        <Text style={styles.title}>Meal Planner Mobile</Text>
        <Text style={styles.subtitle}>Base app is cleaned and ready for Tamagui setup.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  upperContainer: {
    height: 200,
    backgroundColor: '#34eb80',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#475569',
  },
});
