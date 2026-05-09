import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, EllipsisVertical, Pencil, Trash2 } from '@tamagui/lucide-icons-2';
import { SizableText, XStack, YStack, styled } from 'tamagui';

import { ApplyTemplateModal, type ApplyTemplateSelection } from './ApplyTemplateModal';
import { DeleteTemplateModal } from './DeleteTemplateModal';

export interface TemplateActionsMenuProps {
    onApplyToDate?: (selection: ApplyTemplateSelection) => void;
    onDelete?: () => void;
    templateId: string;
    triggerColor?: string;
}

type AnchorLayout = {
    height: number;
    width: number;
    x: number;
    y: number;
};

const MENU_WIDTH = 210;
const MENU_HEIGHT = 164;

const TemplateCardMenu = styled(YStack, {
    name: 'TemplateCardMenu',
    bg: '$background',
    br: '$radius.lg',
    py: '$xs',
    overflow: 'hidden',
    shadowColor: '$color.gray10',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    borderWidth: 1,
    borderColor: '$color.gray4',
});

const TemplateCardMenuItem = styled(XStack, {
    name: 'TemplateCardMenuItem',
    minHeight: 48,
    px: '$space.md',
    py: '$space.sm',
    ai: 'center',
    gap: '$space.sm',

    pressStyle: {
        bg: '$surfacePress',
    },
});

export function TemplateActionsMenu({
    onApplyToDate,
    onDelete,
    templateId,
    triggerColor = '$textSubtle',
}: TemplateActionsMenuProps) {
    const router = useRouter();
    const menuTriggerRef = useRef<any>(null);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorLayout, setAnchorLayout] = useState<AnchorLayout | null>(null);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    const measureAnchor = useCallback((callback?: () => void) => {
        const host = menuTriggerRef.current as {
            measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void;
        } | null;

        if (!host?.measureInWindow) {
            callback?.();
            return;
        }

        host.measureInWindow((x, y, width, height) => {
            setAnchorLayout({ x, y, width, height });
            callback?.();
        });
    }, []);

    const openMenu = useCallback(() => {
        measureAnchor(() => {
            setIsMenuOpen(true);
        });
    }, [measureAnchor]);

    const handleEditTemplate = useCallback(() => {
        closeMenu();
        router.push(`/template/${templateId}/edit`);
    }, [closeMenu, router, templateId]);

    const handleApplyToDate = useCallback(() => {
        closeMenu();
        setIsApplyModalOpen(true);
    }, [closeMenu]);

    const handleApplyTemplate = useCallback(
        (selection: ApplyTemplateSelection) => {
            onApplyToDate?.(selection);
            setIsApplyModalOpen(false);
        },
        [onApplyToDate],
    );

    const handleDeleteTemplate = useCallback(() => {
        closeMenu();
        setIsDeleteModalOpen(true);
    }, [closeMenu]);

    const handleConfirmDelete = useCallback(() => {
        setIsDeleteModalOpen(false);
        onDelete?.();
    }, [onDelete]);

    const menuLeft = anchorLayout
        ? Math.max(16, Math.min(anchorLayout.x + anchorLayout.width - MENU_WIDTH, screenWidth - MENU_WIDTH - 16))
        : 16;
    const menuTop = anchorLayout
        ? Math.max(16, Math.min(anchorLayout.y + anchorLayout.height + 8, screenHeight - MENU_HEIGHT - 16))
        : 16;

    return (
        <>
            <XStack
                ref={menuTriggerRef}
                w={32}
                h={32}
                ai="center"
                jc="center"
                br="$radius.pill"
                onPress={openMenu}
                pressStyle={{ bg: '$surfacePress', opacity: 0.86 }}
            >
                <EllipsisVertical color={triggerColor} size={18} />
            </XStack>

            <Modal
                transparent
                visible={isMenuOpen}
                animationType="fade"
                onRequestClose={closeMenu}
                statusBarTranslucent
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
                    {anchorLayout ? (
                        <Pressable
                            style={{
                                position: 'absolute',
                                top: menuTop,
                                left: menuLeft,
                                width: MENU_WIDTH,
                            }}
                            onPress={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <TemplateCardMenu>
                                <TemplateCardMenuItem onPress={handleEditTemplate}>
                                    <Pencil color="$text" size={16} />
                                    <SizableText ff="$body" fos="$md" fow="$medium" col="$text">
                                        Edit template
                                    </SizableText>
                                </TemplateCardMenuItem>

                                <TemplateCardMenuItem onPress={handleApplyToDate}>
                                    <CalendarDays color="$text" size={16} />
                                    <SizableText ff="$body" fos="$md" fow="$medium" col="$text">
                                        Apply to date...
                                    </SizableText>
                                </TemplateCardMenuItem>

                                <TemplateCardMenuItem onPress={handleDeleteTemplate}>
                                    <Trash2 color="$danger" size={16} />
                                    <SizableText ff="$body" fos="$md" fow="$medium" col="$danger">
                                        Delete template
                                    </SizableText>
                                </TemplateCardMenuItem>
                            </TemplateCardMenu>
                        </Pressable>
                    ) : null}
                </Pressable>
            </Modal>

            <ApplyTemplateModal
                open={isApplyModalOpen}
                onOpenChange={setIsApplyModalOpen}
                onApply={handleApplyTemplate}
            />

            <DeleteTemplateModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}