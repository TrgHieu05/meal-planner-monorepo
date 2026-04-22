import React from 'react'
import { IconProps } from '@tamagui/helpers-icon'
import { GetProps, XStack, Text, styled } from 'tamagui'

export const TagFrame = styled(XStack, {
  name: 'Tag',

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
      },
      danger: {
        bg: "$softDanger",
      },
    },
  } as const,

  defaultVariants: {
    status: 'brand',
  },
})

type TagStatus = GetProps<typeof TagFrame>['status']

interface TagProps {
  children: string
  icon?: React.ElementType<IconProps>
  status?: TagStatus
}

const getContentColor = (status: TagStatus) => {
  switch (status) {    
    case 'brand': return '$primary'
    case 'danger': return '$danger'
    default: return '$blue10'
  }
}

export const Tag = ({ icon: Icon, status = 'brand', children, ...props }: TagProps) => {
  const contentColor = getContentColor(status)

  return (
    <TagFrame status={status} {...props}>
      {Icon && <Icon size={16} color={contentColor} strokeWidth={2.5}/>}
      <Text color={contentColor} ff="$body" fos="$md" fow="$semiBold">{children}</Text>
    </TagFrame>
  )
}