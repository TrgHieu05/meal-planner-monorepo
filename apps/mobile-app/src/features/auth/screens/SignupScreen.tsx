import { View, SizableText, Label, YStack, XStack } from 'tamagui'
import { Button } from '@components'
import { InputText } from '@/components/InputText'
import { Link } from 'expo-router'

export default function SignupScreen() {
	return (
		<YStack bg="$background" flex={1} alignItems="center" justifyContent="center">
			<YStack w="100%" h={160} px="$md" ai="flex-start" jc="center" bg="$primary" br="$radius.lg" overflow="hidden">
				<View h={118} w={118} position="absolute" bg="$jade7" br="$radius.pill" top={-20} right={-24} />
				<View h={96} w={96} position="absolute" bg="$jade8" br="$radius.pill" bottom={-44} left={-8} />
				<View h={96} w={96} position="absolute" bg="$jade5" br="$radius.pill" bottom={-60} left={40} />

				<SizableText ff="$heading" fos="$h2" fow="$bold" col="$textInverse">
					Create account
				</SizableText>
			</YStack>

			<YStack px="$md" py="$lg" w="100%" h="fill" flex={1} ai="center" jc="flex-start" gap="$space.xl">
				<YStack w="100%" gap="$md">
					<YStack w="100%" gap="$xs">
						<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor="full-name">
							Full name
						</Label>
						<InputText id="full-name" placeholder="Enter your full name" />
					</YStack>

					<YStack w="100%" gap="$xs">
						<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor="email">
							Email
						</Label>
						<InputText id="email" placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
					</YStack>

					<YStack w="100%" gap="$xs">
						<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor="password">
							Password
						</Label>
						<InputText id="password" placeholder="Create a password" secureTextEntry />
					</YStack>

					<YStack w="100%" gap="$xs">
						<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle" htmlFor="confirm-password">
							Confirm password
						</Label>
						<InputText id="confirm-password" placeholder="Repeat your password" secureTextEntry />
					</YStack>
				</YStack>

				<Button color="primary" size="large" onPress={() => console.log('Signing up')}>
					<Button.Text>Create Account</Button.Text>
				</Button>

				<SizableText ff="$body" fos="$sm" fow="$regular" col="$textSubtle" ta="center">
					By continuing, you agree to the Terms and Privacy Policy.
				</SizableText>

				<XStack w="100%" gap="$space.xs" ai="center" jc="center">
					<SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Already have an account?
					</SizableText>
					<Link href="/login">
						<SizableText col="$primary" ff="$body" fos="$md" fow="$semiBold">
							Log in
						</SizableText>
					</Link>
				</XStack>
			</YStack>
		</YStack>
	)
}
