import React from 'react'
import { IconProps } from '@tamagui/helpers-icon'
import { GetProps, XStack, Text, styled, createStyledContext, withStaticProperties } from 'tamagui'

const TagContext = createStyledContext({
  status: 'brand',
  color: '$primary',
})


export const TagFrame = styled(XStack, {
  name: 'Tag',
  context: TagContext,

  flexDirection: 'row',
  alignSelf: 'flex-start',
  ai: 'center',
  br: '$pill',
  px: '$md',
  py: '$sm',
  gap: '$space.sm',

  variants: {
    status: {
      brand: {
        bg: "$softPrimary",
        color: '$primary',
      },
      danger: {
        bg: "$softDanger",
        color: '$danger',
      },
    },
  } as const,

  defaultVariants: {
    status: 'brand',
  },
})

export const TagText = styled(Text, {
  name: 'TagText',
  context: TagContext,
  ff: '$body',
  fos: '$md',
  fow: '$semiBold',

  variants: {
    status: {
      brand: { color: '$primary', },
      danger: { color: '$danger', },
    },
  } as const,
})

export const TagIcon = ({icon: IconComponent, ...props} : {icon: React.ElementType<IconProps>} & IconProps) => {
  const { color } = TagContext.useStyledContext()
  return <IconComponent color={ color } size={16} {...props} />
}

export const Tag = withStaticProperties(TagFrame, {
  Text: TagText,
  Icon: TagIcon,
})