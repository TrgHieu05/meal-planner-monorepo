import { useState } from 'react'
import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputSelect, InputText } from '@components'

export default function EditPreferenceScreen() {
	const router = useRouter()
	const theme = useTheme()
	const [dietType, setDietType] = useState('Keto')
	const [goal, setGoal] = useState('Weight Loss')
	const [targetCalories, setTargetCalories] = useState('2000')
	const [activityLevel, setActivityLevel] = useState('Active')

	const dietOptions = ['Keto', 'Balanced', 'Vegetarian', 'Vegan']
	const goalOptions = ['Weight Loss', 'Maintain Weight', 'Gain Muscle']
	const activityOptions = ['Low', 'Average', 'Active']

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background" jc="space-between">
				<YStack px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
							<ChevronLeft color={theme.text.val} size={24} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Edit Preferences & Rules
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Diet Type
							</Label>
							<InputSelect options={dietOptions} value={dietType} onValueChange={setDietType} w="100%" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Goal
							</Label>
							<InputSelect options={goalOptions} value={goal} onValueChange={setGoal} w="100%" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Target Calories
							</Label>
							<InputText value={targetCalories} onChangeText={setTargetCalories} keyboardType="number-pad" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Activity Level
							</Label>
							<InputSelect
								options={activityOptions}
								value={activityLevel}
								onValueChange={setActivityLevel}
								w="100%"
							/>
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