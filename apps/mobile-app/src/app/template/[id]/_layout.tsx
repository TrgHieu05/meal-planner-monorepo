import { Stack } from 'expo-router';

export default function TemplateDetailLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="edit" options={{ headerShown: false }} />
        </Stack>
    );
}