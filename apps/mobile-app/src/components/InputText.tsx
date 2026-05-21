import { forwardRef } from 'react'
import type { GetProps } from 'tamagui'
import { Input, SizableText, Text, YStack, styled } from 'tamagui'

const InputTextField = styled(Input, {
    name: 'InputArea',
    w: '100%',
    h: 52,
    br: '$md',
    bw: 0,
    px: '$md',

    bg: '$surface',
    cursorColor: '$primary',
    fontFamily: '$body',
    fontSize: '$md',
    placeholderTextColor: '$textSubtle',
    color: '$text',

    variants: {
        error: {
            true: {
                outlineWidth: 1.5,
                outlineColor: '$danger',
            },
        },
    } as const,

    focusStyle: {
        outlineWidth: 1.5,
        outlineColor: '$primary',
    },

    pressStyle: {
        bg: '$surfacePress',
    },

    disabledStyle: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
})

type InputTextFieldProps = GetProps<typeof InputTextField>

export type InputTextProps = InputTextFieldProps & {
    error?: boolean
    errorMessage?: string
}

export const InputText = forwardRef<any, InputTextProps>(function InputText(
    { error = false, errorMessage, ...props },
    ref,
) {
    const hasError = error || Boolean(errorMessage)

    return (
        <YStack w="100%" gap="$xs">
            <InputTextField
                ref={ref}
                error={hasError}
                focusStyle={{
                    outlineWidth: 1.5,
                    outlineColor: hasError ? '$danger' : '$primary',
                }}
                {...props}
            />
            {errorMessage ? (
                <SizableText ff="$body" fos="$sm" col="$danger">
                    {errorMessage}
                </SizableText>
            ) : null}
        </YStack>
    )
})











