import { LogOut } from '@tamagui/lucide-icons-2';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, SizableText, Tabs, YStack, useTheme, XStack } from 'tamagui';

import { SettingItem } from '../components/SettingItem';
import { SettingsHeader } from '../components/SettingsHeader';

import { useSession } from '@/providers/AuthProvider';
export default function SettingScreen() {
    const theme = useTheme();
    const { signOut } = useSession();

    return (
        <SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
            <YStack p="$md" gap="$lg" w="100%">
                <SettingsHeader />

                <ScrollView showsVerticalScrollIndicator={false}>
                    <YStack br="$radius.md" overflow="hidden" >
                        <SettingItem label="Account" Icon={LogOut} onPress={() => {}} />
                        <SettingItem label="Notifications" Icon={LogOut} onPress={() => {}} />
                        <SettingItem label="Privacy" Icon={LogOut} onPress={() => {}} />
                        <SettingItem label="Logout" Icon={LogOut} onPress={() => void signOut()} isLast />
                    </YStack>
                </ScrollView>
            </YStack>
        </SafeAreaView>
    );
}