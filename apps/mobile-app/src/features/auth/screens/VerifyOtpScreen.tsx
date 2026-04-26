import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button } from '@components'
import { OTPInput } from '@/components/InputOtp'

const PREVIEW_EMAIL = 'hello@kitchenmind.com'

export default function VerifyOtpScreen() {
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
							Verify OTP
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md" ai="center">
						<SizableText ff="$body" fos="$md" fow="$regular" col="$textSubtle" ta="center" lh={22}>
							An OTP has beed sent to the email {PREVIEW_EMAIL}.
						</SizableText>

						<OTPInput length={6} />

						<SizableText
							ff="$body"
							fos="$md"
							fow="$semiBold"
							col="$primary"
						>
							Resend code
						</SizableText>
					</YStack>
				</YStack>

				<YStack px="$md" pb="$lg">
					<Button color="primary" size="large" onPress={() => router.push('/reset-password')}>
						<Button.Text>Verify</Button.Text>
					</Button>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}