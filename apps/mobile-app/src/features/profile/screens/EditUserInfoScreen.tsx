import { useState } from 'react'
import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputDate, InputSelect, InputText } from '@components'

export default function EditUserInfoScreen() {
	const router = useRouter()
	const theme = useTheme()           
	const [fullName, setFullName] = useState('Emily Cuper')
	const [gender, setGender] = useState('Female')
	const [birthDate, setBirthDate] = useState<Date>(new Date(1998, 7, 15))
	const genderOptions = ['Female', 'Male', 'Other']

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background" jc="space-between">
				<YStack px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
							<ChevronLeft color={theme.text.val} size={24} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Edit User Information
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Full Name
							</Label>
							<InputText value={fullName} onChangeText={setFullName} />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Gender
							</Label>
							<InputSelect options={genderOptions} value={gender} onValueChange={setGender} w="100%" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Date of Birth
							</Label>
							<InputDate value={birthDate} onValueChange={setBirthDate} w="100%" />
						</YStack>
					</YStack>
				</YStack>

				<YStack px="$md" pb="$lg">
					<Button color="primary" size="large" onPress={() => router.replace('/profile')}>
						<Button.Text>Save changes</Button.Text>
					</Button>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}