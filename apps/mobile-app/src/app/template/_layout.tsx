import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useTheme } from 'tamagui';
import { useAppTheme } from '../../providers/AppProviders';

export default function TemplateLayout() {
    const theme = useTheme();
    const { themeName } = useAppTheme();
    const isDark = themeName === 'dark';

    return (
        <SafeAreaView style={[{ width: '100%', height: '100%' }, { backgroundColor: theme.background.val }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="create-template" options={{ headerShown: false }} />
                <Stack.Screen name="[id]" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaView>
    );
}