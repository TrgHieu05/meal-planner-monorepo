import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { View, SizableText, Label, YStack, XStack } from 'tamagui'
import { Lock, LogIn } from '@tamagui/lucide-icons-2'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import GoogleIcon from '@assets/svg/google-icon.svg'
import { Alert, Button, InputText, Divider } from '@components'
import { useSession } from '@/providers/AuthProvider'
import { useGoogleIdTokenSignIn } from '@features/auth/hooks/useGoogleIdTokenSignIn'

export default function LoginScreen() {
    const router = useRouter();
    const { signInWithGoogleIdToken } = useSession();
    const { passwordReset } = useLocalSearchParams<{ passwordReset?: string }>();
    const [showPasswordResetAlert, setShowPasswordResetAlert] = useState(false);
    const [googleSignInError, setGoogleSignInError] = useState<string | null>(null);
    const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
    const {
        clearError: clearGoogleHookError,
        error: googleHookError,
        isReady: isGoogleSignInReady,
        signInForIdToken,
    } = useGoogleIdTokenSignIn();

    useEffect(() => {
        if (passwordReset === 'success') {
            setShowPasswordResetAlert(true);
            router.setParams({ passwordReset: undefined });
        }
    }, [passwordReset, router]);

    useEffect(() => {
        if (!googleHookError) {
            return;
        }

        setGoogleSignInError(googleHookError);
    }, [googleHookError]);

    const handlePasswordResetAlertChange = useCallback(
        (nextOpen: boolean) => {
            setShowPasswordResetAlert(nextOpen);
        },
        [],
    );

    const handleGoogleSignInAlertChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                setGoogleSignInError(null);
                clearGoogleHookError();
            }
        },
        [clearGoogleHookError],
    );

    const handleGoogleSignIn = useCallback(async () => {
        setGoogleSignInError(null);
        clearGoogleHookError();
        setIsGoogleSigningIn(true);

        try {
            const idToken = await signInForIdToken();
            const nextSession = await signInWithGoogleIdToken(idToken);
            router.replace(
                nextSession.user.isOnboardingCompleted ? '/' : '/onboarding/step-1',
            );
        } catch (error) {
            setGoogleSignInError(getGoogleSignInErrorMessage(error));
        } finally {
            setIsGoogleSigningIn(false);
        }
    }, [clearGoogleHookError, router, signInForIdToken, signInWithGoogleIdToken]);

    const handleEmailPasswordLogin = useCallback(() => {
        setGoogleSignInError(
            'Đăng nhập email/password chưa được triển khai trong phase Android-only. Hãy dùng Google Sign-In.',
        );
    }, []);

    return (
        <YStack bg="$background" flex={1} alignItems="center" justifyContent="center">
            <YStack w="100%" h={240} px="$md" ai="flex-start" jc="center" bg="$primary" br="$radius.lg" overflow="hidden">
                <View h={128} w={128} position='absolute' bg='$jade7' br="$radius.pill" bottom={-64} left={20} />
                <SizableText ff="$heading" fos="$h2" fow="$bold" col="$textInverse">Welcome back</SizableText>
                <SizableText ff="$body" fos="$md" fow="$medium" col="$textInverse">
                    Plan meals faster with your saved preferences and weekly routine.
                </SizableText>
            </YStack>

            <YStack px="$md" py="$lg" w="100%" h="fill" flex={1} ai="center" jc="flex-start" gap="$space.xl">
                <YStack w="100%" gap="$md">
                    <YStack w="100%" gap="$xs">
                        <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor='email'>Email</Label>
                        <InputText id="email" placeholder="Enter your email"/>
                    </YStack>

                    <YStack w="100%" gap="$xs">
                        <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">Password</Label>
                        <InputText readOnly placeholder="Enter your email" secureTextEntry/>
                    </YStack>

                    <XStack w="100%" ai="center" justifyContent="flex-end">
                        <Link href="/forgot-password">
                            <SizableText col="$primary" ff="$body"fos="$md" fow="$semiBold" ta="right">Forgot password?</SizableText>
                        </Link>
                    </XStack>
                </YStack>

                <Button color="primary" size="large" w="100%" onPress={handleEmailPasswordLogin}>
                    <Button.Text>Login with Email</Button.Text>
                    <Button.Icon icon={LogIn} />
                </Button>

                <YStack w="100%" gap="$md">
                    <Divider label="Or continue with" />
                    <Button
                        color="secondary"
                        size="large"
                        disabled={!isGoogleSignInReady || isGoogleSigningIn}
                        onPress={handleGoogleSignIn}
                    >
                        <GoogleIcon height={24} width={24} />
                        <Button.Text>
                            {isGoogleSigningIn ? 'Signing in with Google...' : 'Continue with Google'}
                        </Button.Text>
                    </Button>
                </YStack>


                <XStack w="100%" gap="$space.xs" ai="center" jc="center">
                    <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">Don't have an account?</SizableText>
                    <Link href="/signup">
                        <SizableText col="$primary" ff="$body"fos="$md" fow="$semiBold">Sign up</SizableText>
                    </Link>
                </XStack>
            </YStack>

            <Alert
                variant="success"
                icon={Lock}
                open={showPasswordResetAlert}
                onOpenChange={handlePasswordResetAlertChange}
                title="PASSWORD UPDATED"
                description="Your password has been changed successfully. Please log in again."
            />

            <Alert
                variant="error"
                open={Boolean(googleSignInError)}
                onOpenChange={handleGoogleSignInAlertChange}
                title="GOOGLE SIGN-IN FAILED"
                description={googleSignInError ?? ''}
            />
            
        </YStack>
    )
}

function getGoogleSignInErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return 'Không thể kết nối tới máy chủ. Hãy kiểm tra mạng và EXPO_PUBLIC_API_BASE_URL.'
        }

        if (error.response.status === 401) {
            return 'Google token không hợp lệ hoặc tài khoản Google chưa xác minh email.'
        }

        if (error.response.status === 422) {
            return 'Payload Google Sign-In không hợp lệ khi gửi tới backend.'
        }

        const responseMessage = error.response.data?.message
        if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
            return responseMessage.trim()
        }

        return 'Backend không thể xử lý đăng nhập Google lúc này.'
    }

    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message.trim()
    }

    return 'Đăng nhập Google thất bại. Hãy thử lại.'
}