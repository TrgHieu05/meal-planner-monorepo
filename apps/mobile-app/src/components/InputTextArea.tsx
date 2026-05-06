import { forwardRef } from 'react'
import type { GetProps } from 'tamagui'
import { TextArea, SizableText, YStack, styled } from 'tamagui'

const InputTextAreaField = styled(TextArea, {
    name: 'InputArea',
    w: '100%',
    h: 104,
    br: '$md',
    bw: 0,
    p: '$md',
    textAlignVertical: 'top',


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

type InputTextAreaFieldProps = GetProps<typeof InputTextAreaField>

export type InputTextAreaProps = InputTextAreaFieldProps & {
    error?: boolean
    errorMessage?: string
}

export const InputTextArea = forwardRef<any, InputTextAreaProps>(function InputTextArea(
    { error = false, errorMessage, ...props },
    ref,
) {
    const hasError = error || Boolean(errorMessage)

    return (
        <YStack w="100%" gap="$xs">
            <InputTextAreaField
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











