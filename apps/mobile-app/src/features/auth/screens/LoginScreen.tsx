import {Text, XStack, YStack } from 'tamagui';
import GoogleIcon from '@assets/svg/google-icon.svg';
import FacebookIcon from '@assets/svg/facebook-icon.svg';

export default function LoginScreen() {
    return (
        <YStack h="100%" ai="center" jc="center">

            <Text ff="$heading" fos="$h1" fow="$bold">
                Welcome to Kitchen Mind
            </Text>

            <XStack ai="center" gap="$md" jc="center">
                <XStack bw={1} p="$space.md" borderRadius={999} alignItems="center" alignSelf='flex-start' gap={8}>
                    <FacebookIcon width={20} height={20} />
                </XStack>
                <XStack p="$space.md" borderRadius={16} alignItems="center" alignSelf='flex-start' gap={8}>
                    <GoogleIcon width={20} height={20} />
                </XStack>
            </XStack>
        </YStack>
    );
}

