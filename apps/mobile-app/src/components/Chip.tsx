import React from 'react'
import { IconProps } from '@tamagui/helpers-icon'
import { Text, XStack, styled, createStyledContext, withStaticProperties } from 'tamagui'

export type ChipTone = 'neutral' | 'brand' | 'danger'

const ChipContext = createStyledContext({
	tone: 'neutral' as ChipTone,
	color: '$color.gray11',
})

export const ChipFrame = styled(XStack, {
	name: 'Chip',
	context: ChipContext,

	fd: 'row',
	alignSelf: 'flex-start',
	ai: 'center',
	br: '$pill',
	px: '$md',
	py: '$sm',
	gap: '$space.sm',

	pressStyle: {
		opacity: 0.88,
		scale: 0.97,
	},

	variants: {
		tone: {
			neutral: {
				bg: '$surface',
				color: '$text',
                pressStyle: {
                    bg: '$surfacePress',
                },
			},
			brand: {
				bg: '$softPrimary',
				color: '$primary',
                pressStyle: {
                    bg: '$softPrimaryHover',
                },
			},
			danger: {
				bg: '$softDanger',
                color: '$textDanger',
                pressStyle: {
                    bg: '$softDangerHover',
			    },
		    },
	} as const,

	defaultVariants: {
		tone: 'neutral',
	},
}})

export const ChipText = styled(Text, {
	name: 'ChipText',
	context: ChipContext,
	ff: '$body',
	fos: '$md',
	fow: '$semiBold',
    color: '$tone',
})

export const ChipIcon = ({ icon: IconComponent, ...props }: { icon: React.ElementType<IconProps> } & IconProps) => {
	const { color } = ChipContext.useStyledContext()

	return <IconComponent color={color} size={16} {...props} />
}

export const Chip = withStaticProperties(ChipFrame, {
	Text: ChipText,
	Icon: ChipIcon,
})