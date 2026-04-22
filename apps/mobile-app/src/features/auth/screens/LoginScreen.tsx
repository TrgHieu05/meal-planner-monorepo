import { useMemo, useState } from 'react';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';
import GoogleIcon from '@assets/svg/google-icon.svg';
import FacebookIcon from '@assets/svg/facebook-icon.svg';

import { useSession } from '@features/auth/hooks/useSession';

const DEV_ACCESS_TOKEN =
    process.env.EXPO_PUBLIC_ACCESS_TOKEN?.trim() ??
    process.env.EXPO_PUBLIC_PROFILE_ACCESS_TOKEN?.trim() ??
    '';

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return 'Unable to restore a session with that token.';
};

export default function LoginScreen() {
    const { signInWithToken } = useSession();
    const [accessToken, setAccessToken] = useState(DEV_ACCESS_TOKEN);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasPrefilledToken = useMemo(() => DEV_ACCESS_TOKEN.length > 0, []);

    const handleSignIn = async () => {
        const trimmedToken = accessToken.trim();
        if (!trimmedToken) {
            setErrorMessage('Paste a valid backend JWT to continue.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await signInWithToken(trimmedToken);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <YStack f={1} px="$lg" py="$xl" ai="center" jc="center" gap="$lg">
            <YStack gap="$sm" ai="center" maw={420}>
                <Text ff="$heading" fos="$h1" fow="$bold" textAlign="center">
                Welcome to Kitchen Mind
                </Text>

                <Text ff="$body" fos="$md" col="$textSubtle" textAlign="center">
                    Phase 1 restores an app session from a backend JWT and keeps it in secure storage.
                    Google and Facebook sign-in will be connected in Phase 2.
                </Text>
            </YStack>

            <YStack w="100%" maw={420} gap="$md">
                <Input
                    value={accessToken}
                    onChangeText={setAccessToken}
                    placeholder="Paste backend access token"
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    minHeight={120}
                    textAlignVertical="top"
                />

                {hasPrefilledToken ? (
                    <Text ff="$body" fos="$sm" col="$textSubtle">
                        Using EXPO_PUBLIC_ACCESS_TOKEN as the initial value.
                    </Text>
                ) : null}

                {errorMessage ? (
                    <Text ff="$body" fos="$sm" col="$textDanger">
                        {errorMessage}
                    </Text>
                ) : null}

                <Button
                    h="hug"
                    ai="center"
                    jc="center"
                    bg="$primary"
                    py="$sm"
                    disabled={isSubmitting}
                    onPress={handleSignIn}
                >
                    <XStack ai="center" gap="$sm">
                        {isSubmitting ? <Spinner size="small" color="$textInverse" /> : null}
                        <Text ff="$body" fos="$md" fow="$medium" col="$textInverse">
                            Restore session
                        </Text>
                    </XStack>
                </Button>
            </YStack>

            <XStack ai="center" gap="$md" jc="center">
                <XStack bw={1} p="$space.md" borderRadius={999} alignItems="center" gap={8} opacity={0.4}>
                    <FacebookIcon width={20} height={20} />
                </XStack>
                <XStack p="$space.md" borderRadius={16} alignItems="center" gap={8} opacity={0.4}>
                    <GoogleIcon width={20} height={20} />
                </XStack>
            </XStack>
        </YStack>
    );
}

