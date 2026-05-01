import { Search } from '@tamagui/lucide-icons-2'
import { forwardRef, useState } from 'react'
import type { GetProps } from 'tamagui'
import { Input, SizableText, XStack, YStack, styled, useTheme } from 'tamagui'

const InputSearchFrame = styled(XStack, {
	name: 'InputSearchFrame',
	w: '100%',
	h: 52,
	br: '$md',
	bw: 0,
	px: '$md',
	gap: '$sm',
	ai: 'center',

	bg: '$surface',

	variants: {
		error: {
			true: {
				outlineWidth: 1.5,
				outlineColor: '$danger',
			},
		},
		focused: {
			true: {
				outlineWidth: 1.5,
				outlineColor: '$primary',
			},
		},
	} as const,

	pressStyle: {
		bg: '$surfacePress',
	},

	disabledStyle: {
		opacity: 0.6,
	},
})

const InputSearchField = styled(Input, {
	name: 'InputSearchField',
	f: 1,
	h: '100%',
	bw: 0,
	p: 0,
	bg: 'transparent',
	cursorColor: '$primary',
	fontFamily: '$body',
    fontWeight: '$medium',
	fontSize: '$md',
	placeholderTextColor: '$textSubtle',
	color: '$text',

	focusStyle: {
		outlineWidth: 0,
	},

	disabledStyle: {
		cursor: 'not-allowed',
	},
})

type InputSearchFieldProps = GetProps<typeof InputSearchField>

export type InputSearchProps = InputSearchFieldProps & {
	error?: boolean
	errorMessage?: string
}

export const InputSearch = forwardRef<any, InputSearchProps>(function InputSearch(
	{ error = false, errorMessage, onFocus, onBlur, ...props },
	ref,
) {
	const theme = useTheme()
	const [isFocused, setIsFocused] = useState(false)
	const hasError = error || Boolean(errorMessage)

	return (
		<YStack w="100%" gap="$xs">
			<InputSearchFrame error={hasError} focused={!hasError && isFocused}>
				<Search color={theme.textSubtle.val} size={20} />
				<InputSearchField
					ref={ref}
					onFocus={(event) => {
						setIsFocused(true)
						onFocus?.(event)
					}}
					onBlur={(event) => {
						setIsFocused(false)
						onBlur?.(event)
					}}
					{...props}
				/>
			</InputSearchFrame>
			{errorMessage ? (
				<SizableText ff="$body" fos="$sm" col="$danger">
					{errorMessage}
				</SizableText>
			) : null}
		</YStack>
	)
})