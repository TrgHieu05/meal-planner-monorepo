import { SizableText, XStack, YStack } from 'tamagui'

export type RadioButtonProps = {
	label: string
	selected?: boolean
	disabled?: boolean
	onPress?: () => void
}

export function RadioButton({
	label,
	selected = false,
	disabled = false,
	onPress,
}: RadioButtonProps) {
	return (
		<XStack
			ai="center"
			gap="$sm"
			opacity={disabled ? 0.5 : 1}
			onPress={disabled ? undefined : onPress}
			pressStyle={
				disabled
					? undefined
					: {
						opacity: 0.88,
						scale: 0.98,
					}
			}
		>
			<XStack w={28} h={28} ai="center" jc="center">
				<YStack
					w={18}
					h={18}
					br="$pill"
					ai="center"
					jc="center"
					bg="$background"
					borderWidth={3}
					borderColor={selected ? '$primary' : '$color.gray6'}
				>
					{selected ? <YStack w={8} h={8} br="$pill" bg="$primary" /> : null}
				</YStack>
			</XStack>
			<SizableText ff="$body" fos="$md" fow="$medium" col="$text">
				{label}
			</SizableText>
		</XStack>
	)
}