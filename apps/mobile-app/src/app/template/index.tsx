import { YStack, SizableText } from 'tamagui';

export default function Templates() {
    return (
        <YStack f={1} ai="center" jc="center" bg="$background">
            <SizableText ff="$heading" fos="$h2" fow="$bold" color="$text">
                Templates Screen
            </SizableText>
        </YStack>
    );
}