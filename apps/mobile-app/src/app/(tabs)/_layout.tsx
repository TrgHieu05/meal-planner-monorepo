import { Tabs } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, SizableText } from 'tamagui';
import { useAppTheme } from '../../providers/AppProviders';
import { Home, Utensils, BarChart3, User} from '@tamagui/lucide-icons-2';

export default function TabLayout() {
  const theme = useTheme();
  const { themeName } = useAppTheme();
  const isDark = themeName === 'dark';

  return (
    <SafeAreaView style={[{ width: '100%', height: '100%' }, { backgroundColor: theme.background.val }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Tabs 
        screenOptions={{ 
          headerShown: false,
          tabBarActiveTintColor: theme.primary.get(),
          tabBarInactiveTintColor: theme.gray9.get(),
          tabBarStyle: {
            backgroundColor: theme.background.get(),
            height: 56,
            borderTopWidth: 1,
            elevation: 0,
          },

          tabBarLabel: ({ color, children }) => (
            <SizableText fontSize="$xs" ff="$body" fontWeight="$semiBold" color={color}>{children}</SizableText>
          ),
        }}
      >
        <Tabs.Screen name="index"
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            title: 'Home',
          }}
        />
        <Tabs.Screen name="menu"
          options={{
            tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} />,
            title: 'Menu',
          }}
        />
        <Tabs.Screen name="metrics"
          options={{
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
            title: 'Metrics',
          }}
        />
        <Tabs.Screen name="profile"
          options={{
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            title: 'Profile',
          }}
        />
      </Tabs>
    </SafeAreaView>
    
  );
}