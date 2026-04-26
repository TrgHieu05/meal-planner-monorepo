import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputText } from '@components'

const PREVIEW_EMAIL = 'hello@kitchenmind.com'

export default function ForgotPasswordScreen() {
	const router = useRouter()
	const theme = useTheme()

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background" jc="space-between">
				<YStack px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack
							pos="absolute"
							l={0}
							p="$xs"
							onPress={() => router.back()}
							pressStyle={{ opacity: 0.7 }}
						>
							<ChevronLeft color={theme.text.val} size={20} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Forgot Password
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<SizableText ff="$body" fos="$md" fow="$regular" col="$textSubtle" lh={22} ta="center">
							Please enter your email below. We&apos;ll send an OTP to this email to reset your password.
						</SizableText>

                        <InputText
                            id="forgot-password-email"
                            defaultValue={PREVIEW_EMAIL}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
					</YStack>
				</YStack>

				<YStack px="$md" pb="$lg">
					<Button color="primary" size="large" onPress={() => router.push('/verify-otp')}>
						<Button.Text>Send OTP</Button.Text>
					</Button>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}