import { View, styled, createStyledContext, SizableText, withStaticProperties, Text } from 'tamagui'
import { IconProps } from '@tamagui/helpers-icon'
export const ButtonContext = createStyledContext({
    size: '$md',
    iconSize: 16,
    color: '$text',
})

export const ButtonFrame = styled(View, {
    name: 'Button',
    context: ButtonContext,
    flexDirection: 'row',

    gap: '$space.sm',
    borderRadius: '$radius.md',
    alignItems: 'center',
    justifyContent: 'center',


    pressStyle: {
        scale: 0.98,
    },
    disabledStyle: {
        opacity: 0.6,
    },

    variants: {
      color: {
        primary: {
            bg: '$primary',
            color: '$textInverse',
            pressStyle: {
                bg: '$primaryPress',
            },
        },
        secondary: {
            bg: '$surface',
            color: '$text',
            pressStyle: {
                bg: '$surfaceHover',
            },
        },
        danger: {
            bg: '$danger',
            color: '$textInverse',
            pressStyle: {
                bg: '$dangerPress',
            },
        },
      },
      
      size: {
        large: {
            h: 54,
            px: '$space.lg',
            iconSize: 20,
        },

        medium: {
            h: 36,
            px: '$space.md',
            iconSize: 16,
        },
    
    } as const,
    },

    defaultVariants: {
        color: 'primary',
        size: 'medium',
    },
})

export const ButttonText = styled(SizableText, {
    name: 'ButtonText',
    context: ButtonContext,
    color: '$color',
    userSelect: 'none',
    ff: '$body',
    fow: '$semiBold',

    variants: {
        size: {
            large: {
                fos: '$lg',
            },
            medium: {
                fos: '$md',
            },
        } as const,
    }
})

export const ButtonIcon = ({icon: IconComponent, ...props} : {icon: React.ElementType<IconProps>} & IconProps) => {
  const { color, iconSize } = ButtonContext.useStyledContext()
  return <IconComponent color={ color } size={ iconSize } {...props} />
}

export const Button = withStaticProperties(ButtonFrame, {
    Text: ButttonText,
    Icon: ButtonIcon,
})
