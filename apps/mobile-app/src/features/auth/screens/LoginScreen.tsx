import { useCallback, useEffect, useState } from 'react'
import { View, SizableText, Label, YStack, XStack } from 'tamagui'
import { Lock, LogIn } from '@tamagui/lucide-icons-2'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import GoogleIcon from '@assets/svg/google-icon.svg'
import FacebookIcon from '@assets/svg/facebook-icon.svg'
import { useAuthStore } from '@store/authStore'
import { Alert, Button, InputText, Divider } from '@components'

export default function LoginScreen() {
    const { login } = useAuthStore();
    const router = useRouter();
    const { passwordReset } = useLocalSearchParams<{ passwordReset?: string }>();
    const [showPasswordResetAlert, setShowPasswordResetAlert] = useState(false);

    useEffect(() => {
        if (passwordReset === 'success') {
            setShowPasswordResetAlert(true);
            router.setParams({ passwordReset: undefined });
        }
    }, [passwordReset, router]);

    const handlePasswordResetAlertChange = useCallback(
        (nextOpen: boolean) => {
            setShowPasswordResetAlert(nextOpen);
        },
        [],
    );

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

                <Button color="primary" size="large" onPress={login}>
                    <Button.Text>Login</Button.Text>
                    <Button.Icon icon={LogIn} />
                </Button>

                <YStack w="100%" gap="$md">
                    <Divider label="Or continue with" />
                    <XStack w="100%" gap="$lg" ai="center" justifyContent="center">
                        <Link href="/login-with-google-placeholder">
                            <XStack  p="$space.md" br="$radius.pill" bg="$surface" ai="center" jc="center">
                                <GoogleIcon width={24} height={24} />
                            </XStack>
                        </Link>

                        <Link href="/login-with-facebook-placeholder">
                            <XStack  p="$space.md" br="$radius.pill" bg="$surface" ai="center" jc="center">
                                <FacebookIcon width={24} height={24} />
                            </XStack>
                        </Link>
                    </XStack>
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
            
        </YStack>
    )
}