import { Tabs } from 'expo-router';
import { useTheme, Text } from 'tamagui';
import { Home, Utensils, BarChart3, User} from '@tamagui/lucide-icons-2';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: theme.primary.get(),
        tabBarInactiveTintColor: theme.gray9.get(),
        tabBarStyle: {
          backgroundColor: theme.background.get(),
          height: 60,
          borderTopWidth: 1,
          elevation: 0,
        },

        tabBarLabel: ({ color, children }) => (
          <Text fontSize="$md" ff="$body" fontWeight="$bold" color={color} allowFontScaling={false}>{children}</Text>
        ),
      }}
    >
      <Tabs.Screen name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'Home',
        }}
      />
      <Tabs.Screen name="meals"
        options={{
          tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} />,
          title: 'Meals',
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
  );
}