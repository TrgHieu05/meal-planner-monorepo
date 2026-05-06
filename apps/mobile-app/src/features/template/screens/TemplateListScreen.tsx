import { YStack, XStack, SizableText } from 'tamagui';
import { ChevronLeft, Plus, SlidersHorizontal, Grid2x2Plus } from '@tamagui/lucide-icons-2';
import { useRouter } from 'expo-router';
import { Button } from '@components';

export default function TemplateListScreen() {
    const router = useRouter();
    const isEmpty = true;

    return (
        <YStack f={1} ai="center" bg="$background" p="$space.md" gap="$space.lg">
            <XStack h={40} ai="center" jc="center" pos="relative" w="100%">
                <XStack
                    pos="absolute"
                    l={0}
                    p="$xs"
                    onPress={() => router.back()}
                    pressStyle={{ opacity: 0.7 }}
                >
                    <ChevronLeft color="$text" size={20} />
                </XStack>
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Templates
                </SizableText>
            </XStack>

            <XStack w="100%" ai="center" jc="flex-end" gap="$space.sm">
                <Button color="secondary" size="medium" br="$radius.pill">
                    <Button.Icon icon={SlidersHorizontal} />
                    <Button.Text>Filter</Button.Text>
                </Button>
                <Button color="primary" size="medium" br="$radius.pill" onPress={() => router.push('template/create-template')}>
                    <Button.Icon icon={Plus} />
                    <Button.Text>Create</Button.Text>
                </Button>
            </XStack>

            {isEmpty && 
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.lg">
                    <Grid2x2Plus color="$textPrimary" size={240} opacity={0.5}/>
                    <SizableText ff="$body" fos="$md" fow="$semiBold" color="$textSubtle" whiteSpace="pre-line" ta="center">
                        {`You currently have no template. \n Press "+ Create" to create one!`}
                    </SizableText>
                    <YStack h={100}/>
                </YStack>
            }
        </YStack>
    );
}