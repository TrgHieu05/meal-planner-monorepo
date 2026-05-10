import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { CalendarDays } from '@tamagui/lucide-icons-2';
import { SizableText, XStack, YStack } from 'tamagui';

import { TemplateActionsMenu } from '@features/template/components/TemplateActionsMenu';
import type { ApplyTemplateSelection } from '@features/template/components/ApplyTemplateModal';

export interface TemplateCardProps {
    dayCount: number;
    nutritionSummary: string;
    onApplyToDate?: (selection: ApplyTemplateSelection) => Promise<void> | void;
    onDelete?: () => Promise<void> | void;
    templateId: string;
    title: string;
}

export function TemplateCard({
    dayCount,
    nutritionSummary,
    onApplyToDate,
    onDelete,
    templateId,
    title,
}: TemplateCardProps) {
    const router = useRouter();

    const handleOpenTemplateDetail = useCallback(() => {
        router.push(`/template/${templateId}`);
    }, [router, templateId]);

    return (
        <YStack w="100%" bg="$background" br="$radius.xl" borderWidth={1} borderColor="$color.gray5" overflow="hidden">
            <YStack onPress={handleOpenTemplateDetail} pressStyle={{ opacity: 0.96, bg: '$surfacePress' }}>
                <YStack h={180} bg="$surface" />

                <YStack w="100%" p="$space.md" gap="$space.xs">
                    <XStack w="100%" ai="center" jc="space-between" gap="$space.md">
                        <SizableText ff="$heading" fos="$lg" fow="$bold" col="$text" f={1} numberOfLines={1}>
                            {title}
                        </SizableText>

                        <TemplateActionsMenu
                            templateId={templateId}
                            triggerColor="$textSubtle"
                            onApplyToDate={onApplyToDate}
                            onDelete={onDelete}
                        />
                    </XStack>

                    <XStack ai="center" gap="$space.xs">
                        <CalendarDays color="$primary" size={16} />
                        <SizableText ff="$body" fos="$sm" fow="$semiBold" col="$primary">
                            {`${dayCount} Days Plan`}
                        </SizableText>
                    </XStack>

                    <SizableText ff="$body" fos="$xs" fow="$medium" col="$textSubtle">
                        {nutritionSummary}
                    </SizableText>
                </YStack>
            </YStack>
        </YStack>
    );
}