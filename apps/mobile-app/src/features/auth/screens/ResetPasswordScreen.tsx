import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputText } from '@components'

export default function ResetPasswordScreen() {
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
							Reset Password
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor="reset-password">
								Password
							</Label>
							<InputText id="reset-password" placeholder="Enter your password" secureTextEntry />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor="reset-confirm-password">
								Confirm Password
							</Label>
							<InputText id="reset-confirm-password" placeholder="Repeat your password" secureTextEntry />
						</YStack>
					</YStack>
				</YStack>

				<YStack px="$md" pb="$lg">
					<Button color="primary" size="large" onPress={() => {router.dismissAll(); router.replace('/login?passwordReset=success')}}>
						<Button.Text>Change Password</Button.Text>
					</Button>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}