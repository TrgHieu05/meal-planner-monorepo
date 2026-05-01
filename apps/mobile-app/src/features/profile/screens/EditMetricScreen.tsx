import { useState } from 'react'
import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputText } from '@components'

export default function EditMetricScreen() {
	const router = useRouter()
	const theme = useTheme()
	const [height, setHeight] = useState('165')
	const [weight, setWeight] = useState('55')

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background" jc="space-between">
				<YStack px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
							<ChevronLeft color={theme.text.val} size={24} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Edit Metric
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Height (cm)
							</Label>
							<InputText value={height} onChangeText={setHeight} keyboardType="number-pad" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Weight (kg)
							</Label>
							<InputText value={weight} onChangeText={setWeight} keyboardType="number-pad" />
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