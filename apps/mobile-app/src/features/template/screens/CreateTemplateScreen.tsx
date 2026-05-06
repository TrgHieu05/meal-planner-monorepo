import { useRouter } from 'expo-router';
import { YStack, XStack, SizableText, ScrollView, Label } from 'tamagui';
import { ChevronLeft, Copy, Clipboard, Trash2, Plus } from '@tamagui/lucide-icons-2';
import { Button, InputText, InputTextArea } from '@components';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';

export default function CreateTemplateScreen() {
    const router = useRouter();

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
                    Create template
                </SizableText>
            </XStack>

            <ScrollView style={{ flex: 1, width: '100%', overflow: 'visible'}} contentContainerStyle={{ paddingBottom: 32 }}>
                <YStack w="100%" gap="$space.lg" overflow="visible">
                    <YStack w="100%" gap="$space.xs">
                        <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">Template name</Label>
                        <InputText placeholder="e.g. My Weekly Template" />
                    </YStack>

                    <YStack w="100%" gap="$space.sm">
                        <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">Description</Label>
                        <InputTextArea placeholder="Enter brief description for this template" />
                    </YStack>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <XStack>
                            
                        </XStack>

                    </ScrollView>

                    <XStack w="100%" ai="center" jc="flex-end" gap="$space.sm">
                        <Button size="medium" color="secondary">
                            <Button.Icon icon={Copy} />
                            <Button.Text>Copy meals</Button.Text>
                        </Button>

                        <Button size="medium" color="secondary">
                            <Button.Icon icon={Clipboard} />
                            <Button.Text>Paste</Button.Text>
                        </Button>

                        <Button size="medium" color="danger">
                            <Button.Icon icon={Trash2} />
                            <Button.Text>Delete</Button.Text>
                        </Button>
                    </XStack>
                </YStack>
            </ScrollView>

        </YStack>
    );
}