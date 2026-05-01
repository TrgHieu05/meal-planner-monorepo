import React, { useRef, useState } from 'react'
import { Input, Text, XStack, YStack, SizableText, styled, View } from 'tamagui'

// Styled component cho từng ô vuông hiển thị số
const OTPDigit = styled(View, {
  width: 48,
  height: 48,
  borderRadius: '$md',
  borderColor: '$borderColor',
  ai: 'center',
  jc: 'center',
  bg: '$surface',

  variants: {
    error: {
      true: {
        outlineWidth: 1.5,
        outlineColor: '$danger',
        bg: "$softDanger"
      },
    },
    focused: {
      true: {
        outlineWidth: 1.5,
        outlineColor: '$primary', // Highlight nhẹ khi đang focus
      },
    },
    hasValue: {
      true: {
        bg: '$softPrimary', // Màu nền khác khi có giá trị
      }
    }
  } as const,
})

type OTPInputProps = {
  length?: number
  onComplete?: (code: string) => void
  error?: boolean
  errorMessage?: string
}

export const OTPInput = ({
  length = 4,
  onComplete,
  error = false,
  errorMessage,
}: OTPInputProps) => {
  const [code, setCode] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<React.ComponentRef<typeof Input>>(null)
  const hasError = error || Boolean(errorMessage)

  const handlePress = () => {
    inputRef.current?.focus()
  }

  const handleChange = (text: string) => {
    // Chỉ cho phép nhập số và giới hạn độ dài
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, length)
    setCode(cleanText)
    if (cleanText.length === length) {
      onComplete?.(cleanText)
    }
  }

  return (
    <YStack ai="center" gap="$md" w="100%">
      <XStack gap="$sm" w="100%" justifyContent="space-between" onPress={handlePress}>
        {Array(length)
          .fill(0)
          .map((_, i) => {
            const char = code[i] || ''
            const isCurrentFocused = isFocused && (code.length === i || (code.length === length && i === length - 1))

            return (
              <OTPDigit key={i} error={hasError} focused={!hasError && isCurrentFocused} hasValue={!!char}>
                <SizableText fontSize="$xl" fontWeight="$semiBold" col="$textPrimary">
                  {char}
                </SizableText>
              </OTPDigit>
            )
          })}
      </XStack>

      {/* Input thật nhưng bị ẩn đi để xử lý logic nhập liệu */}
      <Input
        ref={inputRef}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        opacity={0}
        position="absolute"
        width={1}
        height={1}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {errorMessage ? (
        <Text w="100%" ff="$body" fos="$sm" col="$danger">
          {errorMessage}
        </Text>
      ) : null}
    </YStack>
  )
}