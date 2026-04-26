import { GetProps, Text, XStack, styled } from 'tamagui'

export const DividerFrame = styled(XStack, {
  name: 'Divider',

  w: '100%',
  ai: 'center',
  gap: '$sm',
})

const DividerLine = styled(XStack, {
  name: 'DividerLine',

  f: 1,
  h: 1,
  bg: '$gray6',
})

interface DividerProps extends Omit<GetProps<typeof DividerFrame>, 'children'> {
  label?: string
}

export const Divider = ({ label , ...props }: DividerProps) => {
  return (
    <DividerFrame {...props}>
      <DividerLine />
      <Text ff="$body" fos="$sm" fow="$light" col="$textSubtle">
        {label}
      </Text>
      <DividerLine />
    </DividerFrame>
  )
}