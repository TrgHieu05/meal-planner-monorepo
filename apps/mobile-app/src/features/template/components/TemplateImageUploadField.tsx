import { Trash2, Upload } from '@tamagui/lucide-icons-2';
import { SizableText, XStack, YStack } from 'tamagui';

import { Button, ImageWithFallback } from '@components';

type TemplateImageUploadFieldProps = {
    errorMessage?: string | null;
    helperMessage?: string | null;
    isDisabled?: boolean;
    onPickImage: () => void;
    onRemoveImage: () => void;
    previewUri: string | null;
    showRemoveAction: boolean;
};

export function TemplateImageUploadField({
    errorMessage,
    helperMessage,
    isDisabled = false,
    onPickImage,
    onRemoveImage,
    previewUri,
    showRemoveAction,
}: TemplateImageUploadFieldProps) {
    return (
        <YStack w="100%" gap="$space.sm">
            <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                Cover Image
            </SizableText>

            {previewUri ? (
                <YStack w="100%" gap="$space.sm">
                    <YStack h={220} w="100%" br="$radius.xl" overflow="hidden" bg="$surface" onPress={onPickImage}>
                        <ImageWithFallback
                            accessibilityLabel="Template cover image preview"
                            fallbackSource={require('@assets/images/default-template.jpg')}
                            style={{ width: '100%', height: '100%' }}
                            uri={previewUri}
                        />
                    </YStack>

                    <XStack gap="$space.sm" flexWrap="wrap">
                        <Button color="secondary" disabled={isDisabled} onPress={onPickImage}>
                            <Button.Icon icon={Upload} />
                            <Button.Text>Change image</Button.Text>
                        </Button>

                        {showRemoveAction ? (
                            <Button color="danger" disabled={isDisabled} onPress={onRemoveImage}>
                                <Button.Icon icon={Trash2} />
                                <Button.Text>Remove image</Button.Text>
                            </Button>
                        ) : null}
                    </XStack>
                </YStack>
            ) : (
                <YStack
                    ai="center"
                    jc="center"
                    gap="$space.xs"
                    py="$space.xl"
                    px="$space.lg"
                    bw={2}
                    bc="$primary"
                    br="$radius.xl"
                    bg="$surface"
                    opacity={isDisabled ? 0.65 : 1}
                    onPress={onPickImage}
                    style={{ borderStyle: 'dashed' }}
                >
                    <Upload color="$primary" size={36} />
                    <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
                        Upload your cover image
                    </SizableText>
                    <SizableText ff="$body" fos="$sm" col="$primary" textAlign="center">
                        Browse your photo library
                    </SizableText>
                </YStack>
            )}

            {helperMessage ? (
                <SizableText ff="$body" fos="$sm" col="$textSubtle">
                    {helperMessage}
                </SizableText>
            ) : null}

            {errorMessage ? (
                <SizableText ff="$body" fos="$sm" col="$danger">
                    {errorMessage}
                </SizableText>
            ) : null}
        </YStack>
    );
}