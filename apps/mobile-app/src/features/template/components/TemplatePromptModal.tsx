import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { SizableText, XStack, YStack } from 'tamagui';

import { Button } from '@components';

type TemplatePromptModalProps = {
    cancelLabel: string;
    children?: ReactNode;
    confirmColor?: 'danger' | 'primary';
    confirmLabel: string;
    description?: string;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
    title: string;
};

export function TemplatePromptModal({
    cancelLabel,
    children,
    confirmColor = 'primary',
    confirmLabel,
    description,
    onConfirm,
    onOpenChange,
    open,
    title,
}: TemplatePromptModalProps) {
    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Modal
            animationType="fade"
            transparent
            statusBarTranslucent
            visible={open}
            onRequestClose={handleClose}
        >
            <YStack f={1} ai="center" jc="center" px="$space.md" style={styles.backdrop}>
                <Pressable onPress={handleClose} style={StyleSheet.absoluteFill} />

                <Pressable
                    style={styles.cardWrap}
                    onPress={(event) => {
                        event.stopPropagation();
                    }}
                >
                    <YStack
                        w="100%"
                        maw={360}
                        bg="$background"
                        br="$radius.xl"
                        p="$space.lg"
                        gap="$space.lg"
                        ai="center"
                        shac="$color.gray14"
                        shop={0.1}
                        shar={20}
                        shof={{ width: 0, height: 10 }}
                        elevation={16}
                    >
                        <YStack w="100%" gap="$space.sm" ai="center">
                            <SizableText ff="$heading" fos={20} fow="$bold" col="$text" ta="center">
                                {title}
                            </SizableText>

                            {description ? (
                                <SizableText ff="$body" fos="$md" col="$text" ta="center">
                                    {description}
                                </SizableText>
                            ) : null}
                        </YStack>

                        {children ? <YStack w="100%">{children}</YStack> : null}

                        <XStack w="100%" gap="$space.md">
                            <Button f={1} size="medium" br="$pill" color="secondary" onPress={handleClose}>
                                <Button.Text>{cancelLabel}</Button.Text>
                            </Button>

                            <Button f={1} size="medium" br="$pill" color={confirmColor} onPress={onConfirm}>
                                <Button.Text>{confirmLabel}</Button.Text>
                            </Button>
                        </XStack>
                    </YStack>
                </Pressable>
            </YStack>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(17, 24, 39, 0.48)',
    },
    cardWrap: {
        width: '100%',
        maxWidth: 360,
    },
});